// server.js - À installer sur votre Raspberry Pi (192.168.0.2)
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const si = require('systeminformation');
const WebSocket = require('ws');
const http = require('http');
const { promisify } = require('util');
const execPromise = promisify(exec);

const app = express();
const port = 3000;

// Création du serveur HTTP pour Express et WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route pour tester que l'API fonctionne
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', time: new Date().toISOString() });
});

// Route pour obtenir les informations système (CPU, mémoire, etc.)
app.get('/api/system', async (req, res) => {
  try {
    // Récupération des données CPU
    const cpuData = await si.cpu();
    const cpuLoad = await si.currentLoad();
    
    // Récupération des données mémoire
    const memData = await si.mem();
    
    // Récupération des données de température
    const tempData = await si.cpuTemperature();
    
    // Récupération des données disque
    const diskData = await si.fsSize();
    
    res.json({
      cpu: {
        model: cpuData.manufacturer + ' ' + cpuData.brand,
        cores: cpuData.cores,
        speed: cpuData.speed,
        load: cpuLoad.currentLoad.toFixed(2)
      },
      memory: {
        total: (memData.total / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        used: (memData.used / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        free: (memData.free / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        usedPercentage: ((memData.used / memData.total) * 100).toFixed(2)
      },
      temperature: {
        main: tempData.main || 'N/A',
        cores: tempData.cores || []
      },
      disk: diskData.map(disk => ({
        fs: disk.fs,
        size: (disk.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        used: (disk.used / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        usedPercentage: disk.use.toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des infos système:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données système' });
  }
});

// Route pour obtenir la liste des conteneurs Docker
app.get('/api/docker', (req, res) => {
  exec('docker ps --format "{{.ID}}|{{.Image}}|{{.Status}}|{{.Names}}"', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution de la commande docker: ${error}`);
      return res.status(500).json({ error: 'Erreur lors de la récupération des conteneurs Docker' });
    }
    
    const containers = stdout.trim().split('\n').filter(Boolean).map(container => {
      const [id, image, status, name] = container.split('|');
      return { id, image, status, name };
    });
    
    res.json({ containers });
  });
});

app.get('/api/docker/:containerId/network', async (req, res) => {
    const containerId = req.params.containerId;
    try {
      // Récupérer l'identifiant du processus réseau du conteneur
      const { stdout: pidOutput } = await execPromise(`docker inspect -f '{{.State.Pid}}' ${containerId}`);
      const pid = pidOutput.trim();
      
      if (!pid || pid === '0') {
        return res.status(404).json({ error: 'Conteneur non trouvé ou non en cours d\'exécution' });
      }
      
      // Obtenir les interfaces réseau virtuelle pour ce conteneur
      const { stdout: interfacesOutput } = await execPromise(`ls -la /proc/${pid}/ns/net`);
      const netNsId = interfacesOutput.match(/net:\[(\d+)\]/)[1];
      
      if (!netNsId) {
        return res.status(500).json({ error: 'Impossible de déterminer l\'espace de noms réseau' });
      }
      
      // Trouver l'interface correspondante (veth)
      const { stdout: veths } = await execPromise(`ip -o link show | grep "^[0-9]*: veth"`);
      const vethLines = veths.trim().split('\n');
      let containerVeth = null;
      
      for (const line of vethLines) {
        const vethName = line.match(/^\d+:\s+([^:@]+)/)[1].trim();
        // Vérifier si cette interface est liée au conteneur
        try {
          const { stdout: linkOutput } = await execPromise(`ethtool -S ${vethName} | grep peer_ifindex`);
          if (linkOutput.includes(netNsId)) {
            containerVeth = vethName;
            break;
          }
        } catch (error) {
          // Ignorer les erreurs et continuer avec la prochaine interface
          continue;
        }
      }
      
      if (!containerVeth) {
        // Essayer une approche alternative basée sur les logs iptables
        const { stdout: iptablesOutput } = await execPromise(`iptables -nvL -t filter | grep ${containerId.substring(0, 12)}`);
        if (iptablesOutput) {
          containerVeth = 'Identifié via iptables, mais l\'interface exacte est inconnue';
        } else {
          return res.status(404).json({ error: 'Interface réseau du conteneur non trouvée' });
        }
      }
      
      // Obtenir les statistiques actuelles
      const { stdout: statsOutput } = await execPromise(`cat /proc/net/dev | grep ${containerVeth || 'docker0'}`);
      if (!statsOutput) {
        return res.status(404).json({ error: 'Statistiques réseau non disponibles' });
      }
      
      // Format des données dans /proc/net/dev :
      // Interface: Receive bytes packets errs drop fifo frame compressed multicast | Transmit bytes packets errs drop fifo colls carrier compressed
      const parts = statsOutput.trim().split(/\s+/);
      
      // Calculer les taux (on ne peut pas le faire directement avec une seule lecture)
      // On renvoie les totaux, et le frontend calculera les taux
      res.json({
        interface: containerVeth || 'docker0',
        rx_bytes: parseInt(parts[1]),
        rx_packets: parseInt(parts[2]),
        tx_bytes: parseInt(parts[9]),
        tx_packets: parseInt(parts[10]),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des stats réseau pour ${containerId}:`, error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques réseau' });
    }
  });
  
  // 3. Ajoutez une route pour obtenir les stats réseau d'EarnApp
  app.get('/api/earnapp/network', async (req, res) => {
    try {
      // Vérifier si EarnApp est installé et en cours d'exécution
      const { stdout: psOutput } = await execPromise('ps aux | grep earnapp | grep -v grep');
      if (!psOutput.trim()) {
        return res.json({ status: 'not_running', error: 'EarnApp n\'est pas en cours d\'exécution' });
      }
      
      // Essayer de trouver le processus/conteneur EarnApp
      let earnappProcess = '';
      
      // Essai 1: Rechercher comme conteneur Docker
      try {
        const { stdout: dockerOutput } = await execPromise('docker ps | grep earnapp');
        if (dockerOutput) {
          const containerId = dockerOutput.split(/\s+/)[0];
          
          // Utiliser la même approche que pour les conteneurs Docker
          const response = await fetch(`http://localhost:3000/api/docker/${containerId}/network`);
          const data = await response.json();
          
          // Ajouter des informations supplémentaires
          data.type = 'docker_container';
          data.container_id = containerId;
          
          return res.json(data);
        }
      } catch (error) {
        // Ignorer l'erreur et continuer avec l'approche suivante
      }
      
      // Essai 2: Rechercher comme processus système
      try {
        const { stdout: pidOutput } = await execPromise('pgrep -f earnapp');
        if (pidOutput.trim()) {
          const pid = pidOutput.trim().split('\n')[0];
          
          // Obtenir l'utilisation réseau de ce processus spécifique via nethogs
          // Note: nethogs doit être installé: sudo apt install nethogs
          try {
            const { stdout: nethogsOutput } = await execPromise(`sudo nethogs -t -c 2 | grep ${pid}`);
            if (nethogsOutput) {
              const lines = nethogsOutput.trim().split('\n');
              const lastLine = lines[lines.length - 1].split('\t');
              
              return res.json({
                type: 'system_process',
                pid: pid,
                rx_bytes_per_sec: parseFloat(lastLine[1]) * 1024, // KB/s to bytes/s
                tx_bytes_per_sec: parseFloat(lastLine[2]) * 1024, // KB/s to bytes/s
                timestamp: Date.now()
              });
            }
          } catch (error) {
            // Si nethogs échoue, on utilise une approche alternative
          }
        }
      } catch (error) {
        // Ignorer l'erreur et continuer avec l'approche suivante
      }
      
      // Essai 3: Utiliser les statistiques globales de trafic et prendre la différence avant/après
      // Cette approche est moins précise mais fonctionne comme solution de secours
      const { stdout: beforeOutput } = await execPromise('cat /proc/net/dev | grep wlan0');
      
      // Attendre quelques secondes pour obtenir une différence significative
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { stdout: afterOutput } = await execPromise('cat /proc/net/dev | grep wlan0');
      
      const beforeParts = beforeOutput.trim().split(/\s+/);
      const afterParts = afterOutput.trim().split(/\s+/);
      
      const rxBeforeBytes = parseInt(beforeParts[1]);
      const txBeforeBytes = parseInt(beforeParts[9]);
      const rxAfterBytes = parseInt(afterParts[1]);
      const txAfterBytes = parseInt(afterParts[9]);
      
      // Calculer les taux
      const rxBytesPerSec = (rxAfterBytes - rxBeforeBytes) / 2; // Sur 2 secondes
      const txBytesPerSec = (txAfterBytes - txBeforeBytes) / 2; // Sur 2 secondes
      
      // Estimer la part d'EarnApp (cette estimation est très approximative)
      // À ajuster selon vos observations
      const estEarnappPercentage = 0.5; // Supposons qu'EarnApp utilise environ 50% du trafic
      
      res.json({
        type: 'estimate',
        interface: 'wlan0',
        estimated_rx_bytes_per_sec: rxBytesPerSec * estEarnappPercentage,
        estimated_tx_bytes_per_sec: txBytesPerSec * estEarnappPercentage,
        total_rx_bytes_per_sec: rxBytesPerSec,
        total_tx_bytes_per_sec: txBytesPerSec,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des stats réseau pour EarnApp:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques réseau' });
    }
  });
  
  // 4. Ajoutez cette fonction au bloc collectRealtimeData pour inclure les statistiques réseau globales
  async function collectRealtimeData() {
    try {
      const cpuLoad = await si.currentLoad();
      const memData = await si.mem();
      const tempData = await si.cpuTemperature();
      const networkStats = await si.networkStats();
      
      // Collecter les statistiques de tous les conteneurs Docker actifs
      let dockerNetworkStats = [];
      try {
        const { stdout } = await execPromise('docker ps --format "{{.ID}}"');
        const containerIds = stdout.trim().split('\n').filter(Boolean);
        
        for (const id of containerIds) {
          try {
            // Utiliser nethogs pour obtenir les statistiques réseau par conteneur
            const { stdout: nethogsOutput } = await execPromise(`sudo nethogs -t -c 2 | grep ${id.substring(0, 12)}`);
            if (nethogsOutput) {
              const lines = nethogsOutput.trim().split('\n');
              const lastLine = lines[lines.length - 1].split('\t');
              
              dockerNetworkStats.push({
                id: id,
                rx_bytes_per_sec: parseFloat(lastLine[1]) * 1024, // KB/s to bytes/s
                tx_bytes_per_sec: parseFloat(lastLine[2]) * 1024, // KB/s to bytes/s
              });
            }
          } catch (error) {
            // Ignorer les erreurs individuelles de conteneur
          }
        }
      } catch (error) {
        console.error('Erreur lors de la collecte des stats réseau Docker:', error);
      }
      
      return {
        timestamp: new Date().toISOString(),
        cpu: {
          load: cpuLoad.currentLoad.toFixed(2),
          cores: cpuLoad.cpus.map(core => core.load.toFixed(2))
        },
        memory: {
          used: (memData.used / (1024 * 1024 * 1024)).toFixed(2),
          total: (memData.total / (1024 * 1024 * 1024)).toFixed(2),
          usedPercentage: ((memData.used / memData.total) * 100).toFixed(2)
        },
        temperature: {
          main: tempData.main || 'N/A'
        },
        network: networkStats.map(net => ({
          interface: net.iface,
          rx_sec: (net.rx_sec / 1024).toFixed(2),  // KiB/s
          tx_sec: (net.tx_sec / 1024).toFixed(2)   // KiB/s
        })),
        docker_network: dockerNetworkStats
      };
    } catch (error) {
      console.error('Erreur lors de la collecte des données en temps réel:', error);
      return { error: 'Erreur lors de la collecte des données' };
    }
  }

// Route pour obtenir les stats d'un conteneur Docker spécifique
app.get('/api/docker/:containerId/stats', (req, res) => {
  const containerId = req.params.containerId;
  exec(`docker stats ${containerId} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution de la commande docker stats: ${error}`);
      return res.status(500).json({ error: 'Erreur lors de la récupération des stats du conteneur' });
    }
    
    const [cpuPerc, memUsage, memPerc, netIO, blockIO] = stdout.trim().split('|');
    
    res.json({
      cpuPerc,
      memUsage,
      memPerc,
      netIO,
      blockIO
    });
  });
});

// Route pour obtenir les informations de bande passante réseau
app.get('/api/network', (req, res) => {
  exec('vnstat --json', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution de vnstat: ${error}`);
      return res.status(500).json({ error: 'Erreur lors de la récupération des données réseau' });
    }
    
    try {
      const networkData = JSON.parse(stdout);
      res.json(networkData);
    } catch (parseError) {
      console.error(`Erreur lors du parsing des données vnstat: ${parseError}`);
      res.status(500).json({ error: 'Erreur lors du parsing des données réseau' });
    }
  });
});

// Route pour vérifier le statut d'EarnApp
app.get('/api/earnapp', (req, res) => {
  // Vérifiez d'abord si EarnApp est installé et en cours d'exécution
  exec('ps aux | grep earnapp | grep -v grep', (error, stdout, stderr) => {
    if (stdout.trim() === '') {
      return res.json({ status: 'not_running' });
    }
    
    // Si le service est en cours d'exécution, essayez d'obtenir plus d'informations
    // Note: Cette partie dépend de la façon dont EarnApp est configuré et s'il expose des API locales
    exec('docker logs --tail 20 earnapp 2>&1 | grep -i "bandwidth\\|earning\\|connected"', (error, stdout, stderr) => {
      res.json({
        status: 'running',
        logs: stdout.trim().split('\n').filter(Boolean)
      });
    });
  });
});

// Fonction pour collecter les données en temps réel pour WebSocket
async function collectRealtimeData() {
  try {
    const cpuLoad = await si.currentLoad();
    const memData = await si.mem();
    const tempData = await si.cpuTemperature();
    const networkStats = await si.networkStats();
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        load: cpuLoad.currentLoad.toFixed(2),
        cores: cpuLoad.cpus.map(core => core.load.toFixed(2))
      },
      memory: {
        used: (memData.used / (1024 * 1024 * 1024)).toFixed(2),
        total: (memData.total / (1024 * 1024 * 1024)).toFixed(2),
        usedPercentage: ((memData.used / memData.total) * 100).toFixed(2)
      },
      temperature: {
        main: tempData.main || 'N/A'
      },
      network: networkStats.map(net => ({
        interface: net.iface,
        rx_sec: (net.rx_sec / 1024).toFixed(2),  // KiB/s
        tx_sec: (net.tx_sec / 1024).toFixed(2)   // KiB/s
      }))
    };
  } catch (error) {
    console.error('Erreur lors de la collecte des données en temps réel:', error);
    return { error: 'Erreur lors de la collecte des données' };
  }
}

// WebSocket pour les mises à jour en temps réel
wss.on('connection', (ws) => {
  console.log('Client WebSocket connecté');
  
  // Envoyer des mises à jour toutes les 2 secondes
  const interval = setInterval(async () => {
    const data = await collectRealtimeData();
    ws.send(JSON.stringify(data));
  }, 2000);
  
  ws.on('close', () => {
    console.log('Client WebSocket déconnecté');
    clearInterval(interval);
  });
});

// Démarrage du serveur
server.listen(port, '0.0.0.0', () => {
  console.log(`Serveur API démarré sur http://0.0.0.0:${port}`);
  console.log(`WebSocket démarré sur ws://0.0.0.0:${port}`);
});
