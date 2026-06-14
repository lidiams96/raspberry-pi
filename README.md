# raspberry-pi

Configuración de mi Raspberry Pi 5: bloqueo de anuncios, AirPlay (audio y vídeo),
VPN y un dashboard. Parte va en **Docker** y parte **nativa** en el sistema
(los servicios que se integran a fondo con audio/pantalla/avahi).

La Pi está conectada por **HDMI a la tele** y por un **conversor USB→mini-jack a
un amplificador** (altavoces).

## Servicios

| Servicio | Dónde | Para qué | Acceso |
|---|---|---|---|
| **Pi-hole** | Docker | Bloqueo de anuncios vía DNS | `http://raspberrypi.local/admin` |
| **Tailscale** | Docker | VPN / acceso remoto + adblock fuera de casa | App Tailscale + consola web |
| **Homepage** | Docker | Dashboard de servicios | `http://raspberrypi.local:3000` |
| **shairport-sync** | Nativo | Receptor **AirPlay 2 (audio)** | iOS → altavoz "RaspberryPi" |
| **UxPlay** | Nativo | Receptor **AirPlay (vídeo/pantalla/fotos)** a la TV | iOS → *Duplicar pantalla* → "RaspberryPi" |

Los servicios nativos están documentados en **[host-setup/](host-setup/)**.

## Puesta en marcha / reconstrucción

### 1. Docker
```bash
cp env.example .env        # rellena WEBPASSWORD, etc.
docker compose up -d
```

### 2. Servicios nativos
Sigue **[host-setup/README.md](host-setup/README.md)** para instalar
**shairport-sync** y **UxPlay** (incluye arranque al escritorio y autoarranque).

## Pasos manuales (una sola vez)

### Tailscale (VPN)
```bash
docker exec tailscale tailscale up        # abre la URL y haz login
docker exec tailscale tailscale ip -4     # IP de la Pi en el tailnet
```
**Adblock fuera de casa:** en la [consola de Tailscale → DNS](https://login.tailscale.com/admin/dns)
añade esa IP como *Nameserver* y activa *Override local DNS*. A partir de ahí tu
móvil usa Pi-hole estés donde estés.

### Audio
- **AirPlay (iPhone):** usa "RaspberryPi". Los botones de volumen del iPhone
  funcionan de forma nativa.
- **Volumen del DAC USB en ALSA al máximo** (su nivel de línea es bajo, ver abajo):
  ```bash
  alsamixer            # F6 -> tu DAC; sube todo y quita mute (tecla M)
  sudo alsactl store
  ```
- **Audio del espejado de vídeo (tele vs amplificador):** se elige con PipeWire,
  ver [host-setup/README.md](host-setup/README.md#audio-del-espejado).

## Notas y trampas aprendidas

- **shairport-sync y UxPlay NO van en Docker.** La imagen Docker de
  shairport-sync arranca su propio `dbus-daemon --system`; con `network_mode:
  host` + el `/var/run/dbus` del host montado, **machaca el socket del bus del
  sistema** y tira systemd/logind. Por eso son nativos.
- **Volumen bajo:** el conversor USB→jack barato da poco nivel de línea. El
  arreglo real de volumen/calidad es un **DAC USB decente** o un **HAT I2S
  (HiFiBerry)**. La Pi 5 no tiene salida analógica propia.
- **Vídeo a la TV:** la Pi 5 no decodifica H.264 por hardware → UxPlay usa
  `-avdec` (software). Se renderiza con `waylandsink` desde el escritorio;
  `kmssink` headless no logra el cambio de modo del HDMI.
- **Pi-hole rompe webs:** mira *Query Log → Blocked* cuando algo falle y pasa el
  dominio a la whitelist. Lista recomendada: https://github.com/anudeepND/whitelist
- **Spotify Connect (librespot):** se retiró del stack; con AirPlay basta. Si lo
  quieres de vuelta (control nativo desde la app, soporte Android), está en el
  historial de git.
