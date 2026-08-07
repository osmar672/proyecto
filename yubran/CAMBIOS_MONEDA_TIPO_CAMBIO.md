# Ampliación: moneda de pago y tipo de cambio USD/CRC

## Archivos modificados
- `page/Productos.html`
- `src/js/Productos.js`
- `src/js/app.js`
- `src/style/style.css`
- `README.md`
- `PROMPTS_IA.md`

## Comportamiento agregado
1. El cliente escoge **Colones (CRC)** o **Dólares (USD)** antes de confirmar la compra.
2. En USD, el sistema consulta `https://api.frankfurter.dev/v2/rate/USD/CRC?providers=BCCR`.
3. Se muestra la tasa de referencia, fecha, conversión base y margen empresarial.
4. El margen es 5% del monto convertido: `(totalCRC / tasa) * 1.05`.
5. El total y las cuotas se muestran en la moneda elegida.
6. La tasa válida se cachea en LocalStorage para reducir llamadas; si no hay una tasa válida disponible, el pago en USD se bloquea.
7. La orden guarda moneda, monto cobrado, tasa, fecha de referencia y margen aplicado.

## Integración Git sugerida
```powershell
git status
git diff
git add page/Productos.html src/js/Productos.js src/js/app.js src/style/style.css README.md PROMPTS_IA.md CAMBIOS_MONEDA_TIPO_CAMBIO.md
git commit -m "feat(pagos): agregar conversion CRC USD"
git push
```
