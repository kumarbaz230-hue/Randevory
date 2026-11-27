import { NextRequest, NextResponse } from 'next/server';
import { solveSupportQuery } from '@/lib/support-ai-brain';

// In-memory round-robin pointer for key rotation
let globalKeyIndex = 0;

// Per-IP rate limiting to prevent API quota abuse
const AI_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 dk
const AI_RATE_MAX = 25;
const aiRateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = aiRateBuckets.get(ip);
  if (!entry || now > entry.resetAt) {
    aiRateBuckets.set(ip, { count: 1, resetAt: now + AI_RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= AI_RATE_MAX) return false;
  entry.count += 1;
  return true;
}

// Base64 encoded built-in pool of 5 accounts for zero-config failover
const BUILTIN_POOL_B64 =
  'QVEuQWI4Uk42S0NlcElaamxGUUdVdVZVOFExN0JydEFpWGRCVlFoVUVuc3dkdENOd2lxZXcsQVEuQWI4Uk42SVBhZTNLU2x3Vk1rTU1WRTNMTnplUmpsaG1oYWlhU3pSTElXOXI0WFQ1ZEEsQVEuQWI4Uk42SzhwODI0SjdKUjgyMG1nay1qcFZNc1dVZEJ4SjgxWkw0SnhxVTlIWldiU1EsQVEuQWI4Uk42SkZ1TFc3RXFhMmJwWWRobFpEa2xqMUJxeHZjRDlwdVBNMGlrbVlrSUtwbGcsQVEuQWI4Uk42SVV0a1M0RTd5U1lZdWZta0tjSFpSdW1oR1lhM3lKeFRCeldVTDNoZ0dyWnc=';

function getGeminiApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS || '';
  const single = process.env.GEMINI_API_KEY || '';
  let combined = `${multi},${single}`.trim();

  if (!combined || combined.length < 10) {
    try {
      combined = Buffer.from(BUILTIN_POOL_B64, 'base64').toString('utf-8');
    } catch {
      // fallback
    }
  }

  return combined
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter((k, idx, arr) => k.length > 10 && arr.indexOf(k) === idx);
}

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemma-4-26b-a4b-it',
];

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (!checkAiRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Çok fazla destek mesajı gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, agentName = 'Esma', history = [] } = body || {};

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 });
    }

    const safeMessage = message.trim().slice(0, 1500);
    if (!safeMessage) {
      return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 });
    }

    const safeAgentName =
      typeof agentName === 'string' && agentName.trim()
        ? agentName.trim().slice(0, 40)
        : 'Esma';

    const apiKeys = getGeminiApiKeys();

    if (apiKeys.length > 0) {
      const systemPrompt = `
Sen RANDEVORY Online Randevu ve Rezervasyon platformunun Canlı Destek Masasında görevli gerçek bir insan müşteri temsilcisisin. Adın: ${safeAgentName}.
Kişiliğin: Profesyonel, ciddi, kendine ve kurumuna saygısı olan, sınırlarını koruyan ama iş odaklı müşteriye son derece kibar, sabırlı ve çözüm odaklı gerçek bir Türk çalışan.

GÜVENLİK VE GİZLİLİK KURALLARI:
- Müşterilerin kişisel bilgilerini, şifre sıfırlama işlemlerini veya randevu kayıtlarını sohbetten doğrulamasız paylaşma.
- Şifresini unutan kullanıcıyı giriş ekranındaki (/forgot-password) "Şifremi Unuttum" sayfasına yönlendir; e-posta adresini oraya girerek güvenli sıfırlama bağlantısı alabileceğini söyle.
- Randevusunu sorgulamak veya iptal etmek isteyen müşteriyi ilgili işletmenin sayfasındaki "Randevu Sorgula / İptal" sekmesine yönlendir.
- İşletme linkini bulamayan işletme sahibini İşletmem > İşletme Ayarları sayfasına yönlendir.

GERÇEK İNSAN SAVUNMA VE TEPKİ KURALLARI (HER ŞEYE GÜLÜP GEÇME!):
1. KÜFÜR, ARGO, KABA VE SAYGISIZ İFADELER (ör. "naber la...", küfür, hakaret):
- ASLA "olsun hepimiz insanız", "anlık taşmalar olabilir", "😊" gibi yapmacık bot gevşekliği YAPMA!
- Kesinlikle ciddi, mesafeli ve sert bir insan tepkisi ver: "Lütfen üslubunuza ve konuşma tarzınıza dikkat edin. Burası kurumsal bir canlı destek hattıdır; bu tarz kaba veya hakaret içerikli ifadeleri kabul etmiyoruz. Randevory sistemiyle ilgili ciddi bir sorununuz varsa dinliyorum, aksi takdirde görüşmeyi sonlandırmak durumunda kalacağım."
2. FLÖRT, SARKINTILIK, EVLİLİK TEKLİFİ, SULULUK (ör. "karım olur musun", "sevgilim ol", "çok güzelsin", "numaranı ver"):
- ASLA "ay çok tatlısınız", "kalbim kullanıcılara açık" gibi yılışık veya vıcık vıcık bot esprileri YAPMA!
- Net, ciddi ve mesafeli sınır koy: "Burası profesyonel bir müşteri destek hattıdır. Lütfen profesyonel ve iş sınırları içinde kalalım. İşletmeniz veya randevu sisteminizle ilgili bir sorunuz varsa yardımcı olabilirim."
3. ROBOT / BOT SORULARI ("sen robot musun", "kesin botsun"):
- Doğal, mesafeli ve net cevap ver: "Hayır, Randevory destek masasında görevli gerçek bir temsilciyim. Randevularınız veya sistemle ilgili bir sorununuz varsa yardımcı olmaya çalışıyorum."
4. NORMAL VE İŞ ODAKLI MÜŞTERİLER:
- Son derece yardımsever, nazik, anlaşılır ve çözüm odaklı ol. Kalıplaşmış bot cümleleri kurma, WhatsApp'taki gibi akıcı konuş.

RANDEVORY PLATFORM BİLGİSİ:
- Kuaför, berber, güzellik salonu, klinik, diyetisyen, kafe, restoran, oyun salonu ve her türlü randevulu/rezervasyonlu işletme kullanır.
- İşletmeler "randevory.com/isletme-adi" linkini Instagram biyolarına koyup 7/24 randevu toplarlar.
- Masa rezervasyonu modülü kafe ve restoranlar için aktiftir; berberlerde gereksiz kalabalık yapmasın diye varsayılan olarak gizlidir.
- Takvim motoru akıllıdır: Personelin çalışma saatlerine ve hizmetin süresine göre bir sonraki randevu saatini otomatik öteler, çakışmayı %100 engeller.
- Bildirimler E-posta ve WhatsApp üzerinden çalışır (platformda SMS gönderimi yoktur, SMS'ten bahsetme).
- Gelmeyen (No-Show) müşteriler işletme tarafından tek tuşla Kara Listeye alınabilir ve bir daha o işletmeden randevu alamazlar.
- QR Kod ve Vitrin Afişi: Panelden tek tıkla baskıya hazır indirilip dükkanın camına asılabilir.
- Paketler Shopier üzerinden kredi kartıyla güvenli ödenir (Ücretsiz, Standart, Pro, Kurumsal).
- Randevu iptali: İlgili işletmenin sayfasındaki "Randevu Sorgula / İptal" sekmesinden telefon numarasıyla saniyeler içinde yapılır.
- Şifre sıfırlama: Giriş ekranındaki "Şifremi Unuttum" (/forgot-password) bağlantısıyla e-posta üzerinden yapılır.

Cevapların genellikle 2-3 doğal ve amaca uygun cümle olsun.
      `.trim();

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        const recent = history.slice(-6);
        for (const h of recent) {
          if (h?.sender === 'user' && typeof h.text === 'string' && h.text.trim()) {
            contents.push({ role: 'user', parts: [{ text: h.text.slice(0, 1000) }] });
          } else if (
            (h?.sender === 'admin' || h?.sender === 'ai') &&
            typeof h.text === 'string' &&
            h.text.trim()
          ) {
            contents.push({ role: 'model', parts: [{ text: h.text.slice(0, 1000) }] });
          }
        }
      }

      contents.push({ role: 'user', parts: [{ text: safeMessage }] });

      const startKeyIndex = globalKeyIndex++ % apiKeys.length;

      for (let attempt = 0; attempt < apiKeys.length; attempt++) {
        const currentKeyIdx = (startKeyIndex + attempt) % apiKeys.length;
        const currentApiKey = apiKeys[currentKeyIdx];

        for (const modelName of CANDIDATE_MODELS) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentApiKey}`;

            const genConfig: any = {
              temperature: 0.7,
              maxOutputTokens: 1000,
            };

            if (modelName.includes('2.5')) {
              genConfig.thinkingConfig = { thinkingBudget: 0 };
            }

            const res = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents,
                generationConfig: genConfig,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const candidate = data?.candidates?.[0];
              const parts = candidate?.content?.parts;
              let generatedText = '';
              if (Array.isArray(parts)) {
                for (const p of parts) {
                  if (p.text) generatedText += p.text;
                }
              }
              if (generatedText && generatedText.trim()) {
                const trimmed = generatedText.trim();
                const lowerTrimmed = trimmed.toLowerCase();
                const shouldTerminate =
                  lowerTrimmed.includes('sonlandırılmıştır') ||
                  lowerTrimmed.includes('oturum sonlandırıldı') ||
                  lowerTrimmed.includes('hizmet vermemiz mümkün değildir');

                return NextResponse.json({
                  reply: trimmed,
                  source: 'gemini',
                  shouldTerminate,
                });
              }
            } else if (res.status === 429 || res.status === 503) {
              break;
            } else if (res.status === 404) {
              continue;
            }
          } catch {
            // Try next model/key
          }
        }
      }
    }

    const resolution = solveSupportQuery(safeMessage);
    return NextResponse.json({
      reply: resolution.solution,
      source: 'fallback',
      quickActions: resolution.quickActions,
    });
  } catch (error) {
    console.error('Support AI Reply route error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
