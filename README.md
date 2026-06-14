# raspberry-pi

Configuración de mi Raspberry Pi 5, orquestada con Docker Compose.

## Servicios

| Servicio | Para qué | Acceso |
|---|---|---|
| **Pi-hole** | Bloqueo de anuncios vía DNS | `http://raspberrypi.local/admin` |
| **librespot** (raspotify) | Receptor Spotify Connect | App de Spotify → dispositivo "RaspberryPi" |
| **shairport-sync** (nativo, ver [host-setup/](host-setup/)) | Receptor AirPlay 2 | Cualquier app iOS → altavoz "RaspberryPi" |
| **Tailscale** | VPN / acceso remoto | App Tailscale + consola web |
| **Homepage** | Dashboard de servicios | `http://raspberrypi.local:3000` |

## Puesta en marcha

```bash
cp env.example .env      # y rellena WEBPASSWORD, etc.
docker compose up -d
```

## Pasos manuales (una sola vez)

### Tailscale (VPN)
1. Autentica la Pi:
   ```bash
   docker exec tailscale tailscale up
   ```
   Abre la URL que muestra y haz login.
2. Instala la app **Tailscale** en tu iPhone con la misma cuenta.
3. **Adblock en todas partes:** en la [consola de Tailscale](https://login.tailscale.com/admin/dns)
   → *DNS* → *Nameservers* → añade la IP de Tailscale de la Pi
   (la ves con `docker exec tailscale tailscale ip -4`) y activa *Override local DNS*.
   A partir de ahí tu móvil usa Pi-hole estés donde estés.

### Audio (volumen bajo)
El volumen flojo venía de doble atenuación. Ya está corregido en software
(librespot arranca al 100 %). Asegúrate también del lado de ALSA en la Pi:

```bash
alsamixer            # tecla F6 -> elige tu DAC USB; sube todo y quita mute (tecla M)
sudo alsactl store   # guarda el ajuste
```

> Tu salida es un conversor **USB → mini jack**. Es la causa más probable del
> nivel/calidad bajos: estos dongles dan poco nivel de línea. Si en algún momento
> quieres dar el salto de calidad, un **DAC USB decente** o un **HAT I2S
> (HiFiBerry)** se nota mucho con un amplificador.

### iPhone: control de volumen
Usa **AirPlay** (no Spotify Connect): selecciona el altavoz "RaspberryPi" desde
el iPhone y los botones de volumen físicos funcionan de forma nativa.

## Notas

- **Audio compartido:** librespot y shairport-sync usan el mismo DAC. Liberan la
  tarjeta cuando están en reposo, así que funcionan bien siempre que no
  reproduzcas por ambos a la vez.
- **Homepage** no carga si accedes por un host no listado: ajusta
  `HOMEPAGE_ALLOWED_HOSTS` en `.env`.
- **Pi-hole rompe webs:** mira *Query Log* → *Blocked* justo cuando algo falle y
  pasa el dominio a la whitelist. Lista recomendada de dominios que no conviene
  bloquear: https://github.com/anudeepND/whitelist
