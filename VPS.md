# Subir a tu VPS y mandarle el link al cliente

## Situación del proyecto

En esta carpeta **no hay repositorio git** (no existe `.git`).  
Si “ya pasaste el repo”, probablemente fue **otra carpeta** o un zip. Acá partimos de cero para el VPS.

---

## Opción más simple (recomendada): copiar por SCP + arrancar

### 1) En tu PC (PowerShell), desde la carpeta del proyecto

Reemplazá `USUARIO` e `IP`:

```powershell
# Empaquetar sin node_modules ni basura
tar --exclude=node_modules --exclude=client/node_modules --exclude=server/node_modules --exclude=client/dist --exclude=.git -czf smashr.tgz .

scp smashr.tgz USUARIO@IP:~/
```

### 2) En el VPS (SSH)

```bash
ssh USUARIO@IP

# Si no tenés Node 20:
# Ubuntu/Debian ejemplo:
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt-get install -y nodejs

mkdir -p ~/smashr && cd ~/smashr
tar -xzf ~/smashr.tgz

chmod +x scripts/vps-setup.sh
./scripts/vps-setup.sh
```

### 3) Abrir el puerto y dejarlo corriendo

```bash
# Firewall (Ubuntu ufw)
sudo ufw allow 3001/tcp
sudo ufw status

# Arrancar con PM2 (no se cae al cerrar SSH)
sudo npm i -g pm2
cd ~/smashr
pm2 start server/src/server.js --name smashr -- --prod
pm2 save
pm2 startup   # seguí la instrucción que imprime
```

### 4) Links para el cliente

| Qué | Link |
|-----|------|
| Gestión (login) | `http://TU_IP:3001/` |
| Tablero TV (público) | `http://TU_IP:3001/tablero` |
| Password | `padel2025` |

Decile al cliente:

1. Abrí la **gestión**, entrás con la password.  
2. En otra pestaña/dispositivo abrí el **tablero**.  
3. Creá un partido y puntuá: el tablero se actualiza solo.

---

## Si preferís GitHub (para actualizar más fácil después)

En tu PC, en esta carpeta:

```powershell
git init
git add .
git commit -m "Smashr listo para demo en VPS"
# Creá un repo vacío en GitHub y:
git remote add origin https://github.com/TU_USER/TU_REPO.git
git branch -M main
git push -u origin main
```

En el VPS:

```bash
git clone https://github.com/TU_USER/TU_REPO.git smashr
cd smashr
chmod +x scripts/vps-setup.sh
./scripts/vps-setup.sh
pm2 start server/src/server.js --name smashr -- --prod
pm2 save
```

Para actualizar más adelante:

```bash
cd ~/smashr
git pull
./scripts/vps-setup.sh
pm2 restart smashr
```

---

## Dominio bonito (opcional, después)

Si tenés dominio (`demo.tudominio.com`), con Nginx en el puerto 80:

```nginx
server {
  listen 80;
  server_name demo.tudominio.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Connection "";
    proxy_buffering off;   # importante para SSE (tablero en vivo)
  }
}
```

Así el cliente usa `http://demo.tudominio.com/` y `/tablero` sin el `:3001`.

---

## Checklist rápido si “no carga”

1. `pm2 status` → `smashr` en **online**  
2. `curl http://127.0.0.1:3001/api/health` en el VPS → `{"status":"ok"...}`  
3. Puerto **3001** abierto en el firewall del VPS **y** en el panel del proveedor (Security Group / firewall cloud)  
4. Entrar por **IP pública**, no localhost  

---

## Comandos útiles PM2

```bash
pm2 logs smashr      # ver errores
pm2 restart smashr
pm2 stop smashr
```
