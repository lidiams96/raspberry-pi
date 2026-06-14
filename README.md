# raspberry-pi

Configuración completa de mi **Raspberry Pi 5**: bloqueo de anuncios en toda la
red, recepción de **AirPlay** (audio y vídeo/pantalla desde el iPhone), **VPN**
para usarla fuera de casa, y un **dashboard**.

Todo es **reproducible**: con este repo + un `.env` se reconstruye el sistema.
Parte corre en **Docker** y parte **nativa** (los servicios que necesitan
integración profunda con audio/pantalla/avahi del sistema).

---

## Hardware y conexiones

- **Raspberry Pi 5** con Raspberry Pi OS (Debian Trixie, escritorio **labwc**/Wayland).
- **Audio:** conversor **USB → mini-jack** conectado a un **amplificador** con altavoces.
  - En ALSA es la tarjeta `card 2` ("Audio", USB Audio), `plughw:CARD=Audio,DEV=0`.
  - La Pi 5 **no tiene salida de audio analógica propia**; por eso el dongle USB.
- **Vídeo:** **HDMI a la tele** (una Google TV 4K). El segundo puerto HDMI (DRM
  `HDMI-A-2`, audio ALSA `vc4hdmi`).
- Conectada a la red por WiFi (para AirPlay de vídeo va más fino por Ethernet).

---

## Arquitectura

| Servicio | Dónde | Qué hace |
|---|---|---|
| **Pi-hole** | Docker | DNS que bloquea anuncios/rastreadores en toda la red |
| **Tailscale** | Docker | VPN: adblock fuera de casa + acceso remoto a la Pi |
| **Homepage** | Docker | Dashboard con accesos y estadísticas |
| **shairport-sync** | Nativo | Receptor **AirPlay 2 de audio** |
| **UxPlay** | Nativo | Receptor **AirPlay de vídeo/pantalla** → TV |

**¿Por qué unos en Docker y otros nativos?** shairport-sync y UxPlay necesitan
el avahi/dbus/audio/pantalla del sistema. En concreto, la imagen Docker de
shairport-sync arranca su **propio D-Bus de sistema** y, con red host + el dbus
del host montado, **machaca el bus del sistema** y tumba systemd/logind (nos
pasó). Por eso esos dos van nativos. El resto va perfecto en contenedores.

---

## Puesta en marcha / reconstrucción

### 1. Servicios Docker
```bash
git clone https://github.com/lidiams96/raspberry-pi.git ~/docker
cd ~/docker
cp env.example .env          # y edita los valores (ver tabla abajo)
docker compose up -d
```

### 2. Servicios nativos
Sigue **[host-setup/README.md](host-setup/README.md)**: instala y configura
**shairport-sync** y **UxPlay** (incluye arranque al escritorio y autoarranque).

### 3. Variables del `.env`

| Variable | Para qué | Cómo obtenerla |
|---|---|---|
| `WEBPASSWORD` | Contraseña del panel de Pi-hole | La eliges tú |
| `PIHOLE_API_KEY` | Clave del widget de Pi-hole en Homepage | Misma que `WEBPASSWORD` (o una *app password* de Pi-hole) |
| `HOMEPAGE_ALLOWED_HOSTS` | Host(s) desde los que abrir Homepage | p. ej. `raspberrypi.local:3000,192.168.1.146:3000` |
| `TS_AUTHKEY` | Alta inicial de Tailscale | Auth key en [Tailscale → Keys](https://login.tailscale.com/admin/settings/keys). Tras el alta, se puede vaciar |

> El `.env` **no se versiona** (está en `.gitignore`). Tampoco los datos de
> Pi-hole (`pihole/`) ni el estado de Tailscale (`tailscale/`).

---

## Cómo funciona cada cosa

### Pi-hole (Docker)
- Es el **servidor DNS** de tu red: cada vez que un dispositivo resuelve un
  dominio, Pi-hole lo responde y **bloquea** los de anuncios/rastreo.
- Corre en `network_mode: host` para escuchar el DNS (puerto 53) en todas las
  interfaces, **incluida la de Tailscale** (clave para el adblock fuera de casa).
- **Panel:** `http://raspberrypi.local/admin` (entra con `WEBPASSWORD`).
- **Si una web se rompe:** *Query Log → Blocked*, localiza el dominio culpable y
  pásalo a la whitelist. (Listas de bloqueo demasiado agresivas = más falsos
  positivos.)
- **Interface settings → "Permit all origins":** activado para aceptar las
  consultas que llegan por Tailscale (`100.x`), que no son "locales". Es seguro
  porque el puerto 53 **no** está abierto al exterior en el router; el único
  acceso de fuera es por la VPN cifrada.

### Tailscale (Docker)
- VPN de **malla**: conecta *tus* dispositivos (la Pi y el iPhone) en una red
  privada cifrada.
- **Uso actual (solo DNS):** el iPhone usa Pi-hole como DNS estés donde estés →
  **adblock en cualquier red** (datos móviles, wifi ajeno…). Configurado en
  [Tailscale → DNS](https://login.tailscale.com/admin/dns): la IP Tailscale de
  la Pi como *Nameserver* + *Override local DNS*.
- **No** enruta tu navegación por casa por defecto: solo el DNS. Para tunelizar
  todo el tráfico (wifis públicas) está el **exit node**, dejado listo y
  comentado en `docker-compose.yml`.
- Acceso remoto: con la VPN activa puedes abrir `http://<IP-tailscale-Pi>/admin`
  desde fuera.

### Homepage (Docker)
- Dashboard en `http://raspberrypi.local:3000`.
- Muestra accesos y **widgets** (estadísticas de Pi-hole vía su API; estado de
  los contenedores vía el socket de Docker en solo lectura).
- Configuración en `homepage/config/*.yaml` (servicios, widgets, ajustes,
  marcadores).

### shairport-sync (nativo) — AirPlay audio
- Recibe **AirPlay de audio** desde el iPhone (cualquier app) y lo saca por el
  **DAC USB → amplificador**. En el iPhone aparece como altavoz **"RaspberryPi"**.
- Ventaja sobre Spotify Connect: el control de **volumen del iPhone es nativo**.
- Detalles e instalación: [host-setup/](host-setup/).

### UxPlay (nativo) — AirPlay vídeo / pantalla
- Recibe **duplicado de pantalla / fotos / vídeo** del iPhone y lo pinta en la
  **tele por HDMI** (a través del escritorio Wayland, a pantalla completa).
- La Pi 5 no decodifica H.264 por hardware → decodifica por software (`-avdec`);
  se renderiza con `waylandsink`.
- El audio del espejado se elige (tele o amplificador) desde **PipeWire**
  (`wpctl` o el icono de volumen del escritorio).
- Detalles, autoarranque y "modo media-box": [host-setup/](host-setup/).

---

## Audio: a dónde sale el sonido

- **AirPlay de audio (shairport) y Spotify**: van por **ALSA directo** al DAC USB
  → amplificador. No pasan por PipeWire.
- **Audio del espejado de UxPlay**: va por **PipeWire**; eliges salida con:
  ```bash
  export XDG_RUNTIME_DIR=/run/user/1000
  wpctl status                 # IDs en "Sinks:"  (USB = amplificador, HDMI = tele)
  wpctl set-default <ID_HDMI>  # audio del espejado -> tele
  wpctl set-default <ID_USB>   # audio del espejado -> amplificador
  ```
- **Volumen bajo:** el dongle USB→jack da poco nivel de línea (se compensa desde
  el amplificador). Asegura el mezclador ALSA al máximo: `alsamixer` (F6 → el
  DAC, sube y quita mute) y `sudo alsactl store`. Mejora real de calidad/volumen:
  un DAC USB decente o un HAT I2S.

---

## Trampas aprendidas (para no repetirlas)

- **shairport-sync en Docker tumba el sistema:** su imagen monta su propio
  `dbus-daemon --system`; con red host + `/var/run/dbus` del host montado,
  reemplaza el socket del bus del sistema → `systemctl`/`logind` dejan de
  responder ("org.freedesktop.systemd1 not provided"). Solución: **nativo**.
  Recuperación si pasa: parar/borrar el contenedor y `sudo reboot -f`.
- **Pi 5 sin decodificador H.264 por hardware:** UxPlay debe usar `-avdec`.
- **`kmssink` headless no funciona** en esta combinación (Pi 5 + Trixie + TV 4K):
  falla el cambio de modo del HDMI. Por eso el vídeo va por el **escritorio
  Wayland + `waylandsink`**.
- **Pi-hole rechaza la VPN:** hay que poner **"Permit all origins"** o las
  consultas que llegan por Tailscale (`100.x`) se descartan.
- **Homepage en bridge no resuelve `.local`:** el widget de Pi-hole apunta a la
  **IP** de la Pi, no a `raspberrypi.local`.

---

## Mantenimiento

```bash
cd ~/docker
git pull
docker compose pull          # actualizar imágenes
docker compose up -d         # aplicar
docker compose ps            # estado
docker compose logs -f <servicio>   # logs (pihole | tailscale | homepage)
```
Servicios nativos:
```bash
systemctl status shairport-sync
systemctl --user status        # (en sesión gráfica) / UxPlay arranca con labwc
```
