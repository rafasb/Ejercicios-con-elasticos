# Proxy de windows a wsl2  

## En powershell modo administrador

### Arrancamos el Proxy en la IP local
```bash
netsh interface portproxy add v4tov4 `
  listenaddress=192.168.1.104 listenport=8080 `
  connectaddress=127.0.0.1 connectport=8080
```

### Abrimos el puerto en el firewall
```bash
New-NetFirewallRule -DisplayName "Ritmo 8080" `
  -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

### Verificamos el Proxy
```bash
netsh interface portproxy show all
```

### Eliminar la regla:
```bash
netsh interface portproxy delete v4tov4 listenaddress=192.168.1.102 listenport=8080
```