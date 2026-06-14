# host-setup — servicios nativos en la Raspberry Pi

Estos servicios NO van en Docker: se integran a fondo con el avahi/dbus/audio/
pantalla del host y la versión en contenedor es frágil (la imagen Docker de
shairport-sync llegó a tumbar el D-Bus del sistema y con él systemd/logind).
Se instalan nativos y quedan documentados aquí para reconstruirlos tras una
reinstalación.

Asume el repo clonado en `~/docker` y usuario `rpi` (uid 1000). Ajusta si no.

---

## shairport-sync (AirPlay 2 — audio)

Control de volumen nativo desde el iPhone; convive con cualquier otra cosa.

```bash
sudo apt install -y shairport-sync
sudo cp ~/docker/host-setup/shairport-sync.conf /etc/shairport-sync.conf
sudo systemctl enable --now shairport-sync
systemctl status shairport-sync --no-pager      # "active (running)"
busctl list | grep -q systemd1 && echo "OK: bus del sistema intacto"
```

En el iPhone aparece el altavoz **"RaspberryPi"** (AirPlay).

---

## UxPlay (AirPlay — espejado de pantalla/fotos/vídeo a la TV)

La Pi va conectada por HDMI a la tele. UxPlay recibe el AirPlay de vídeo del
iPhone y lo pinta en la tele a través del escritorio Wayland (labwc).

### Requisitos del sistema

1. **Arrancar al escritorio** (Wayland/labwc) — el compositor controla el HDMI.
   ```bash
   sudo raspi-config nonint do_boot_behaviour B4   # Desktop autologin
   ```
2. **Paquetes:**
   ```bash
   sudo apt install -y uxplay gstreamer1.0-tools gstreamer1.0-plugins-bad
   ```

### Detalles que importan (Pi 5 + Trixie + TV 4K)

- La **Pi 5 no tiene decodificador H.264 por hardware** → hay que decodificar por
  software: opción `-avdec`.
- Se renderiza con **`waylandsink`** (el escritorio gestiona modo/escala/4K).
  `kmssink` headless NO funciona aquí (falla el modeset).

Comando que funciona:
```bash
uxplay -avdec -fs -vs waylandsink
```

### Audio del espejado (elegir tele o amplificador)

El audio del espejado va por **PipeWire**. Se elige la salida con `wpctl`
(o desde el icono de volumen del panel del escritorio):

```bash
export XDG_RUNTIME_DIR=/run/user/1000
wpctl status                 # busca los IDs en "Sinks:"
wpctl set-default <ID_HDMI>  # audio del espejado -> TV
wpctl set-default <ID_USB>   # audio del espejado -> amplificador
```
La elección persiste entre reinicios. (shairport y, si lo reactivas, librespot
usan ALSA directo al DAC, así que esto no les afecta.)

### Autoarranque (dentro de la sesión del escritorio)

`waylandsink` necesita la sesión gráfica, así que UxPlay arranca desde el
autostart de labwc (no como servicio de sistema). Para no romper el panel,
se copia el autostart del sistema y se le añade UxPlay:

```bash
mkdir -p ~/.config/labwc
[ -f ~/.config/labwc/autostart ] || cp /etc/xdg/labwc/autostart ~/.config/labwc/autostart
echo 'lwrespawn uxplay -avdec -fs -vs waylandsink &' >> ~/.config/labwc/autostart
```

`lwrespawn` relanza UxPlay si se cae. Tras reiniciar, UxPlay queda disponible
solo (selecciona "RaspberryPi" en *Duplicar pantalla* del iPhone).
