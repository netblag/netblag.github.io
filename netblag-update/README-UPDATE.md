# به‌روزرسانی بخش «ارتباط با ما» — netblag.github.io

فقط بخش تماس تغییر کرده؛ بقیه‌ی پروژه دست نخورده است.

## چه چیزی عوض شد؟

| فایل | تغییر |
|---|---|
| `src/components/MessageForm.tsx` | **جایگزین کامل** — ارسال دومرحله‌ای (Supabase + نوتیفای فوری)، honeypot ضد اسپم، اعتبارسنجی ۱–۸۰ / ۱–۲۰۰۰ کاراکتر، پیام‌های خطای دوستانه (خطای خام دیتابیس دیگر به بازدیدکننده نشان داده نمی‌شود) |
| `src/lib/config.ts` | **جایگزین** — متغیر جدید `notifyEndpoint` اضافه شد |
| `src/lib/supabase.ts` | بدون تغییر (فقط برای کامل بودن پکیج) |
| `.env.example` | متغیر جدید `VITE_NOTIFY_ENDPOINT` |
| `.github/workflows/deploy.yml` | سکرت جدید `VITE_NOTIFY_ENDPOINT` به مرحله‌ی build اضافه شد |

هیچ تغییری در دیتابیس لازم نیست — همان `schema.sql` و همان RLS.

## مسیر پیام (بعد از این آپدیت)

```
بازدیدکننده فرم را می‌فرستد
        │
        ├─► 1) INSERT در جدول public.messages (سوابق دائمی — داشبورد ادمین)
        │
        └─► 2) POST به VITE_NOTIFY_ENDPOINT
               └─► ایمیل فوری به صندوق شما 📧
```

اگر هر کدام از دو کانال موفق شود، بازدیدکننده «پیام ارسال شد» می‌بیند — یعنی پیام هیچ‌وقت گم نمی‌شود.

## راه‌اندازی نوتیفای ایمیلی (۵ دقیقه، رایگان، بدون بک‌اند)

1. برو به <https://formspree.io> و با ایمیلت (netblag.dev@gmail.com) ثبت‌نام کن.
2. یک Form جدید بساز → آدرسی شبیه `https://formspree.io/f/abcd1234` می‌گیری.
3. در ریپوی گیت‌هاب: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `VITE_NOTIFY_ENDPOINT`
   - Value: `https://formspree.io/f/abcd1234`
4. این فایل‌ها را روی پروژه کپی کن و push کن. GitHub Actions خودش build و deploy می‌کند.

از این به بعد هر پیام کارفرما **بلافاصله به ایمیلت** می‌رسد و نسخه‌ی دائمی‌اش هم در Supabase (داشبورد ادمین) ذخیره است.

> اگر `VITE_NOTIFY_ENDPOINT` را خالی بگذاری، همه‌چیز مثل قبل کار می‌کند (فقط ذخیره در Supabase، بدون ایمیل).

## گزینه‌ی جایگزین (اختیاری): نوتیفای از سمت Supabase

اگر نمی‌خواهی از Formspree استفاده کنی، در داشبورد Supabase:
**Database → Webhooks → Create a new hook** روی جدول `messages` رویداد `INSERT`،
و URL آن را به یک سرویس اتوماسیون (Make / Zapier / n8n) بده تا ایمیل یا پیام تلگرام بفرستد.
مزیت: هیچ چیزی در فرانت تغییر نمی‌کند. عیب: نیاز به سرویس واسطه دارد.

⚠️ هرگز کلید `service_role` را در فرانت یا سکرت‌های Vite قرار نده — فقط publishable key.
