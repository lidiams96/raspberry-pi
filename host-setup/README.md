# host-setup — servicios nativos en la Raspberry Pi

Estos servicios NO van en Docker: se integran a fondo con el avahi/dbus/audio/
pantalla del host y la versión en contenedor es frágil (la imagen Docker de
shairport-sync llegó a tumbar el D-Bus del sistema). Se instalan nativos y se
quedan documentados aquí para poder reconstruirlos tras una reinstalación.

Asume que el repo está clonado en `~/docker` (ajusta las rutas si no).

## shairport-sync (AirPlay 2 — audio)

Control de volumen nativo desde el iPhone; convive con librespot (Spotify).

```bash
sudo apt install -y shairport-sync
sudo cp ~/docker/host-setup/shairport-sync.conf /etc/shairport-sync.conf
sudo systemctl enable --now shairport-sync
systemctl status shairport-sync --no-pager   # debe quedar "active (running)"
```

Comprobar que NO rompe el bus del sistema (a diferencia de la versión Docker):
```bash
busctl list | grep -q systemd1 && echo "OK: bus del sistema intacto"
```

En el iPhone debería aparecer el altavoz **"RaspberryPi"** (AirPlay).

## UxPlay (AirPlay — espejado de vídeo/pantalla/fotos a la TV)

> Pendiente de documentar tras validar `waylandsink` con el escritorio.
