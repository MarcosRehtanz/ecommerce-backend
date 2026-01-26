# Cloudflare Tunnels para Desarrollo

Guia para exponer servicios locales a internet usando Cloudflare Tunnels. Util para:
- Probar webhooks (MercadoPago, Stripe, etc.)
- Compartir el entorno de desarrollo con otros
- Probar en dispositivos moviles

---

## Instalacion

### Windows

```bash
# Con winget
winget install Cloudflare.cloudflared

# O con chocolatey
choco install cloudflared
```

### macOS

```bash
brew install cloudflared
```

### Linux

```bash
# Debian/Ubuntu
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Otras distribuciones: descargar binario desde
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

---

## Uso Rapido (Tunel Temporal)

No requiere cuenta de Cloudflare. Ideal para desarrollo.

```bash
# Exponer un puerto local
cloudflared tunnel --url http://localhost:3000
```

Esto genera una URL publica tipo:
```
https://random-words.trycloudflare.com
```

---

## Tuneles para Dynnamo

### Backend (puerto 3000)

```bash
# Terminal 1
cloudflared tunnel --url http://localhost:3000
```

Salida ejemplo:
```
2024-01-15T10:30:00Z INF +----------------------------+
2024-01-15T10:30:00Z INF | Your quick Tunnel has been created!
2024-01-15T10:30:00Z INF +----------------------------+
2024-01-15T10:30:00Z INF https://painting-paxil-sense-cumulative.trycloudflare.com
```

### Frontend (puerto 3001)

```bash
# Terminal 2
cloudflared tunnel --url http://localhost:3001
```

---

## Configuracion del Frontend

Despues de crear el tunel del backend, actualizar `frontend/.env.local`:

```env
# Usar la URL del tunel (sin /api al final)
NEXT_PUBLIC_API_URL=https://tu-tunel.trycloudflare.com/api
```

**Importante:** Reiniciar el frontend despues de cambiar `.env.local`:

```bash
# Ctrl+C para detener
npm run dev
```

---

## Configuracion de Webhooks

Para MercadoPago u otros servicios que envian webhooks:

1. Crear tunel del backend
2. Configurar la URL de webhook en el servicio externo:
   ```
   https://tu-tunel.trycloudflare.com/api/payments/webhook/mercadopago
   ```

### MercadoPago

En el panel de MercadoPago (Integraciones > Webhooks):
- URL: `https://tu-tunel.trycloudflare.com/api/payments/webhook/mercadopago`
- Eventos: `payment`

---

## Notas Importantes

### URLs Temporales

- Los tuneles rapidos generan URLs **aleatorias** cada vez
- Si reinicias `cloudflared`, obtendras una URL nueva
- Debes actualizar `.env.local` y webhooks externos

### Tuneles Persistentes (Opcional)

Para URLs fijas, necesitas:
1. Cuenta de Cloudflare (gratis)
2. Dominio en Cloudflare
3. Configurar tunel con nombre

```bash
# Login (una vez)
cloudflared tunnel login

# Crear tunel con nombre
cloudflared tunnel create dynnamo-dev

# Ejecutar tunel nombrado
cloudflared tunnel run dynnamo-dev
```

### Rendimiento

- Los tuneles agregan latencia (~50-200ms)
- Solo usar para desarrollo/testing, no produccion
- El trafico pasa por los servidores de Cloudflare

---

## Troubleshooting

### Error: "cloudflared no reconocido"

Verificar instalacion:
```bash
cloudflared --version
```

Si no funciona, agregar al PATH o reinstalar.

### El tunel no conecta

1. Verificar que el servicio local este corriendo
2. Verificar el puerto correcto
3. Probar acceso local primero: `curl http://localhost:3000`

### Webhook no llega

1. Verificar URL del tunel en el servicio externo
2. Verificar que el tunel siga activo
3. Revisar logs del backend para ver requests entrantes

---

## Recursos

- [Documentacion oficial](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Descargas](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
