# 🚀 Render Keep-Alive - Quick Reference

## Endpoints

### /ping (Recommended for CRON)
```bash
GET https://your-backend.onrender.com/ping

Response: {"success":true,"message":"pong","timestamp":"..."}
```

### /health (Detailed Status)
```bash
GET https://your-backend.onrender.com/health

Response: {"success":true,"message":"Service is alive","timestamp":"...","uptime":123,"environment":"production"}
```

## Quick Setup (5 minutes)

### 1. Deploy to Render
```bash
# Your backend is already configured
# Just deploy to Render
```

### 2. Setup CRON (cron-job.org)
1. Visit: https://cron-job.org
2. Create account (free)
3. Add cron job:
   - URL: `https://your-backend.onrender.com/ping`
   - Schedule: `*/10 * * * *` (every 10 minutes)
   - Enable job

### 3. Verify
```bash
# Test endpoint
curl https://your-backend.onrender.com/ping

# Should respond in < 1 second
```

## CRON Schedule Options

```bash
*/5 * * * *   # Every 5 minutes (recommended for production)
*/10 * * * *  # Every 10 minutes (recommended for dev)
*/14 * * * *  # Every 14 minutes (risky, not recommended)
```

## Testing

### Local Test
```bash
curl http://localhost:5000/ping
```

### Production Test
```bash
curl https://your-backend.onrender.com/ping
```

### Time the Request
```bash
time curl https://your-backend.onrender.com/ping
# Should be < 1 second
```

## Troubleshooting

### Service still sleeps
- Check CRON interval (must be < 15 minutes)
- Verify CRON is enabled
- Check CRON service logs

### Slow responses
- Verify endpoint has no DB calls
- Check Render service status
- Monitor Render logs

### 404 Error
- Verify URL is correct
- Check Render deployment status
- Ensure service is running

## Free CRON Services

1. **cron-job.org** (Recommended)
   - Free, unlimited jobs
   - 1-minute minimum interval
   - https://cron-job.org

2. **UptimeRobot**
   - Free, 50 monitors
   - 5-minute minimum interval
   - https://uptimerobot.com

3. **EasyCron**
   - Free tier available
   - https://easycron.com

## Bandwidth Usage

```
Ping every 10 minutes = 144 pings/day
Response size: ~60 bytes
Monthly usage: ~260 KB (0.0003% of 100GB limit)
```

**Conclusion:** Negligible impact on free tier.

## When to Upgrade

Upgrade to Render paid plan ($7/month) when:
- ✅ Integrating payment gateway
- ✅ Production traffic (100+ users/day)
- ✅ Need guaranteed uptime
- ✅ Handling sensitive data

## Important Notes

- ✅ This is a workaround, not an official fix
- ✅ Endpoints are safe (no DB, no auth, no business logic)
- ✅ Works within free tier limits
- ⚠️ Not suitable for production payment processing

## Full Documentation

See: `/backend/RENDER_KEEPALIVE_GUIDE.md`

---

**Status:** ✅ Ready to use  
**Setup Time:** 5 minutes  
**Cost:** $0 (free tier)
