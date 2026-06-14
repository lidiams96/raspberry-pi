# host-setup — servicios NATIVOS en la Raspberry Pi

shairport-sync (AirPlay audio) y UxPlay (AirPlay vídeo) **no van en Docker**: se
integran a fondo con el **avahi/dbus/audio/pantalla** del sistema. Además, la
imagen Docker de shairport-sync arranca su propio D-Bus de sistema y, con red
host, llegó a **tumbar systemd/logind** del host. Por eso se instalan nativos.

Aquí queda documentado para reconstruirlos tras una reinstalación. Se asume el
repo clonado en `~/docker` y usuario `rpi` (uid 1000); ajusta si difiere.

---

## shairport-sync — AirPlay 2 (audio)

### Qué hace
Convierte la Pi en un **altavoz AirPlay** ("RaspberryPi"). El iPhone (cualquier
app) le manda audio y sale por el **DAC USB → amplificador**. El control de
volumen del iPhone funciona de forma nativa.

### Cómo funciona
- Se anuncia por **mDNS/Bonjour** usando el **avahi del host** (por eso es nativo
  y convive con todo).
- Saca el sonido por **ALSA directo** al DAC USB (`plughw:CARD=Audio,DEV=0`), sin
  pasar por PipeWire.
- Corre como servicio **systemd** (`shairport-sync.service`), arranca solo.

### Instalación
```bash
sudo apt install -y shairport-sync
sudo cp ~/docker/host-setup/shairport-sync.conf /etc/shairport-sync.conf
sudo systemctl enable --now shairport-sync
```

### Verificación
```bash
systemctl status shairport-sync --no-pager          # "active (running)"
busctl list | grep -q systemd1 && echo "bus OK"     # el sistema sigue sano
```
En el iPhone debe aparecer el altavoz **"RaspberryPi"**.

> La configuración (`shairport-sync.conf`) define el nombre "RaspberryPi", el
> dispositivo de salida (DAC USB) y libera la tarjeta en reposo para que otras
> apps puedan usarla.

---

## UxPlay — AirPlay (vídeo / pantalla / fotos) a la TV

### Qué hace
Recibe el **duplicado de pantalla / fotos / vídeo** del iPhone y lo muestra en la
**tele** (la Pi va por HDMI a la tele), a pantalla completa.

### Cómo funciona
- Recibe el stream AirPlay (H.264) y lo decodifica **por software** (`-avdec`),
  porque **la Pi 5 no tiene decodificador H.264 por hardware**.
- Lo pinta con **`waylandsink`** dentro del **escritorio Wayland (labwc)**, que es
  quien gestiona el HDMI, la resolución 4K y el escalado. (Probamos `kmssink`
  "headless" y **no** logra el cambio de modo del HDMI en esta Pi 5 + Trixie; por
  eso se usa el escritorio.)
- El audio del espejado va por **PipeWire** (se elige salida tele/amplificador).

### Requisitos del sistema
1. **Arrancar al escritorio** (Wayland/labwc) — el compositor controla el HDMI:
   ```bash
   sudo raspi-config nonint do_boot_behaviour B4    # Desktop autologin
   ```
2. **Paquetes:**
   ```bash
   sudo apt install -y uxplay gstreamer1.0-tools gstreamer1.0-plugins-bad
   ```

### Comando que funciona
```bash
uxplay -avdec -fs -vs waylandsink
```
- `-avdec` = decodificación por software (obligatorio en Pi 5).
- `-fs` = pantalla completa.
- `-vs waylandsink` = render en el escritorio Wayland.

### Audio del espejado (elegir tele o amplificador) {#audio-del-espejado}
Va por PipeWire; se elige el destino (persiste entre reinicios):
```bash
export XDG_RUNTIME_DIR=/run/user/1000
wpctl status                 # busca los IDs en "Sinks:"
wpctl set-default <ID_HDMI>  # audio del espejado -> TV
wpctl set-default <ID_USB>   # audio del espejado -> amplificador
```
(Más cómodo: el icono de volumen del panel del escritorio.) shairport y Spotify
no se ven afectados: usan ALSA directo, no PipeWire.

### Autoarranque (dentro de la sesión del escritorio)
`waylandsink` necesita la sesión gráfica, así que UxPlay arranca desde el
**autostart de labwc** (no como servicio de sistema). Para no romper el panel, se
copia el autostart del sistema y se le añade UxPlay:
```bash
mkdir -p ~/.config/labwc
[ -f ~/.config/labwc/autostart ] || cp /etc/xdg/labwc/autostart ~/.config/labwc/autostart
echo 'lwrespawn uxplay -avdec -fs -vs waylandsink &' >> ~/.config/labwc/autostart
```
`lwrespawn` relanza UxPlay si se cae. Tras reiniciar queda disponible solo
(selecciona "RaspberryPi" en *Duplicar pantalla* del iPhone).

### Modo "media-box" (sin panel del escritorio)
Como en la tele solo se usa de receptor AirPlay (no se interactúa con el
escritorio), conviene quitar el panel: la tele queda limpia y no aparece la
"barra fantasma" duplicada al cerrar el espejado a pantalla completa.
```bash
sed -i '/wf-panel-pi/d' ~/.config/labwc/autostart    # quitar el panel
# (para recuperarlo: re-añade '/usr/bin/lwrespawn /usr/bin/wf-panel-pi &')
```
Glitch puntual del panel (si lo mantienes): `pkill wf-panel-pi` lo redibuja
limpio (lwrespawn lo relanza).

### Rendimiento (cortes)
El espejado AirPlay es vídeo en vivo por WiFi: sensible a la red (pasa también en
Apple nativo). Lo que más ayuda: la **Pi por Ethernet** y el iPhone en **WiFi de
5 GHz** con buena señal. La decodificación por software de la Pi 5 añade un poco.
