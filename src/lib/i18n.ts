export const copy = {
  en: {
    nav: { about: 'About', work: 'Work', stack: 'Stack', tools: 'Tools', contact: 'Contact' },
    hero: {
      eyebrow: 'Software Engineering · Data Science',
      status: 'Building & learning',
      intro: 'Software engineering student exploring data science, machine learning and practical software development.',
      side: 'I like working with data, building software, and understanding why things work — not just making them work.',
      link: 'Explore the work',
    },
    about: {
      label: 'About', secondary: 'A little context',
      large: 'I am a software engineering student moving steadily toward Data Science and Machine Learning.',
      a: 'Python, data analysis, statistics and machine learning make up the core of what I am currently learning. Real datasets are much more interesting to me than toy examples.',
      b: 'I also build Android applications. It keeps the work grounded in actual software instead of staying only inside notebooks and experiments.',
    },
    work: { label: 'Selected work', secondary: 'Things I built' },
    projects: {
      data: { title: 'Data Science', text: 'Working with datasets from cleaning and exploration to visualization and first-pass modeling.', tags: ['Python', 'Pandas', 'NumPy', 'Matplotlib'] },
      ml: { title: 'Machine Learning', text: 'Predictive models, feature engineering, evaluation and model interpretation.', tags: ['Scikit-learn', 'XGBoost', 'SHAP', 'Python'] },
      predictive: { title: 'Predictive Maintenance', text: 'Exploring sensor data to estimate equipment condition and remaining useful life.', tags: ['Python', 'Sensor Data', 'RUL', 'XGBoost'] },
    },
    software: { label: 'Software', secondary: 'Android' },
    apps: {
      darooyar: 'A medication management app focused on schedules, reminders and keeping daily routines simple.',
      lexibook: 'A flashcard learning app for organizing vocabulary and turning review into a routine.',
    },
    stack: { label: 'Stack', secondary: 'Current toolkit', rows: { data: 'Data', ml: 'Machine Learning', development: 'Development', tools: 'Tools' } },
    education: { label: 'Education', secondary: 'Background', degree: '2023 — Present', degreeTitle: 'Software Engineering', degreeText: "Bachelor's degree", focus: 'Current focus', focusTitle: 'Data Science', focusText: 'Statistics · Python · Data Analysis · Machine Learning' },
    contact: { label: 'Get in touch', title: 'LET’S<br>TALK.', text: 'Good ideas, technical conversations and interesting projects are always welcome.' },
    footer: '© 2026 Ashkan Ahmadi',
    tools: {
      title: 'TOOLS', subtitle: 'Small utilities. No account. No nonsense.', back: '← Back home',
      items: [
        ['json', 'JSON Formatter', 'Format, validate and inspect JSON.'],
        ['csv', 'CSV Analyzer', 'Inspect columns, types and quick statistics.'],
        ['regex', 'Regex Tester', 'Test regular expressions against text.'],
        ['markdown', 'Markdown Preview', 'Write Markdown and see the result.'],
        ['text', 'Text Tools', 'Count, transform and compare text.'],
        ['timestamp', 'Timestamp Converter', 'Convert Unix timestamps locally.'],
        ['base64', 'Base64', 'Encode and decode Base64.'],
        ['uuid', 'UUID Generator', 'Generate random UUIDs in your browser.'],
      ] as [string, string, string][],
    },
  },
  fa: {
    nav: { about: 'درباره', work: 'پروژه‌ها', stack: 'تکنولوژی', tools: 'ابزارها', contact: 'ارتباط' },
    hero: {
      eyebrow: 'مهندسی نرم‌افزار · علم داده',
      status: 'در حال ساختن و یادگیری',
      intro: 'دانشجوی مهندسی نرم‌افزارم؛ مسیرم را در علم داده، یادگیری ماشین و ساخت نرم‌افزارهای کاربردی دنبال می‌کنم.',
      side: 'بیشتر از این‌که فقط چیزی را «کار بیندازم»، دوست دارم بفهمم چرا کار می‌کند؛ از داده گرفته تا خودِ محصول.',
      link: 'دیدن پروژه‌ها',
    },
    about: {
      label: 'درباره', secondary: 'کمی درباره مسیر',
      large: 'دانشجوی مهندسی نرم‌افزارم و به‌تدریج تمرکزم را به سمت Data Science و Machine Learning می‌برم.',
      a: 'Python، تحلیل داده، آمار و یادگیری ماشین بخش اصلی مسیری هستند که الان دنبال می‌کنم. داده‌های واقعی برایم جذاب‌تر از مثال‌های مصنوعی و صرفاً آموزشی‌اند.',
      b: 'در کنار Data Science اپلیکیشن اندرویدی هم می‌سازم؛ این بخش باعث می‌شود کارم فقط در notebook و آزمایش باقی نماند و به محصول واقعی هم وصل باشد.',
    },
    work: { label: 'پروژه‌های منتخب', secondary: 'چیزهایی که ساخته‌ام' },
    projects: {
      data: { title: 'Data Science', text: 'از تمیز کردن و بررسی داده تا مصورسازی و ساخت مدل‌های اولیه؛ تمرکز روی پیدا کردن چیزی است که واقعاً از داده می‌شود فهمید.', tags: ['Python', 'Pandas', 'NumPy', 'Matplotlib'] },
      ml: { title: 'Machine Learning', text: 'کار با مدل‌های پیش‌بینی، آماده‌سازی ویژگی‌ها، ارزیابی و بررسی رفتار مدل‌ها.', tags: ['Scikit-learn', 'XGBoost', 'SHAP', 'Python'] },
      predictive: { title: 'Predictive Maintenance', text: 'بررسی داده‌های سنسوری برای تحلیل وضعیت تجهیزات و برآورد زمان باقی‌مانده تا نیاز به نگهداری.', tags: ['Python', 'Sensor Data', 'RUL', 'XGBoost'] },
    },
    software: { label: 'نرم‌افزار', secondary: 'Android' },
    apps: {
      darooyar: 'اپلیکیشنی برای مدیریت برنامه مصرف دارو، یادآوری زمان‌ها و ساده‌تر کردن پیگیری روزانه.',
      lexibook: 'اپلیکیشن فلش‌کارت برای سازمان‌دهی واژگان و تبدیل مرور کردن به یک عادت منظم.',
    },
    stack: { label: 'تکنولوژی', secondary: 'ابزارهای فعلی', rows: { data: 'داده', ml: 'یادگیری ماشین', development: 'توسعه', tools: 'ابزارها' } },
    education: { label: 'تحصیلات', secondary: 'مسیر آموزشی', degree: '۲۰۲۳ — اکنون', degreeTitle: 'مهندسی نرم‌افزار', degreeText: 'دوره کارشناسی', focus: 'تمرکز فعلی', focusTitle: 'Data Science', focusText: 'آمار · Python · تحلیل داده · یادگیری ماشین' },
    contact: { label: 'ارتباط', title: 'حرف<br>بزنیم.', text: 'برای ایده‌های خوب، گفت‌وگوهای فنی و پروژه‌های جالب همیشه جا هست.' },
    footer: '© 2026 Ashkan Ahmadi',
    tools: {
      title: 'ابزارها', subtitle: 'ابزارهای کوچک و کاربردی؛ بدون حساب و دردسر.', back: '← بازگشت به خانه',
      items: [
        ['json', 'JSON Formatter', 'قالب‌بندی، اعتبارسنجی و بررسی JSON.'],
        ['csv', 'CSV Analyzer', 'بررسی ستون‌ها، نوع داده و آمار سریع.'],
        ['regex', 'Regex Tester', 'تست عبارت‌های منظم روی متن.'],
        ['markdown', 'Markdown Preview', 'نوشتن Markdown و مشاهده خروجی.'],
        ['text', 'Text Tools', 'شمارش، تبدیل و مقایسه متن.'],
        ['timestamp', 'Timestamp Converter', 'تبدیل timestamp یونیکس در مرورگر.'],
        ['base64', 'Base64', 'رمزگذاری و رمزگشایی Base64.'],
        ['uuid', 'UUID Generator', 'ساخت UUID تصادفی در مرورگر.'],
      ] as [string, string, string][],
    },
  },
} as const

export type Copy = (typeof copy)['en']
