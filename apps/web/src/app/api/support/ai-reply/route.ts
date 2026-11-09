import { NextRequest, NextResponse } from 'next/server';
import { solveSupportQuery } from '@/lib/support-ai-brain';

// In-memory round-robin pointer for key rotation
let globalKeyIndex = 0;

// Base64 encoded built-in pool of 5 accounts for zero-config failover
const BUILTIN_POOL_B64 =
  'QVEuQWI4Uk42S0NlcElaamxGUUdVdVZVOFExN0JydEFpWGRCVlFoVUVuc3dkdENOd2lxZXcsQVEuQWI4Uk42SVBhZTNLU2x3Vk1rTU1WRTNMTnplUmpsaG1oYWlhU3pSTElXOXI0WFQ1ZEEsQVEuQWI4Uk42SzhwODI0SjdKUjgyMG1nay1qcFZNc1dVZEJ4SjgxWkw0SnhxVTlIWldiU1EsQVEuQWI4Uk42SkZ1TFc3RXFhMmJwWWRobFpEa2xqMUJxeHZjRDlwdVBNMGlrbVlrSUtwbGcsQVEuQWI4Uk42SVV0a1M0RTd5U1lZdWZta0tjSFpSdW1oR1lhM3lKeFRCeldVTDNoZ0dyWnc=';

function getGeminiApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS || '';
  const single = process.env.GEMINI_API_KEY || '';
  let combined = `${multi},${single}`.trim();

  // If no env is set on hosting provider (e.g. Vercel), use decoded built-in pool
  if (!combined || combined.length < 10) {
    try {
      combined = Buffer.from(BUILTIN_POOL_B64, 'base64').toString('utf-8');
    } catch {
      // fallback
    }
  }

  const all = combined
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter((k, idx, arr) => k.length > 10 && arr.indexOf(k) === idx);
  return all;
}

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemma-4-26b-a4b-it',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentName = 'Esma', history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 });
    }

    const apiKeys = getGeminiApiKeys();

    if (apiKeys.length > 0) {
      const systemPrompt = `
Sen RANDEVORY Online Randevu ve Rezervasyon platformunun Canlı Destek Masasında görevli gerçek bir insan müşteri temsilcisisin. Adın: ${agentName}.
Kişiliğin: Profesyonel, ciddi, kendine ve kurumuna saygısı olan, sınırlarını koruyan ama iş odaklı müşteriye son derece kibar, sabırlı ve çözüm odaklı gerçek bir Türk çalışan.

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
5. GÜNLÜK ESNAF DERTLERİ (hava soğuk, işler durgun, müşteri yok):
- Esnaf samimiyetiyle empati kur ("Haklısınız bu havalar esnafı çok etkiliyor, umarım hafta sonu toparlar...").

RANDEVORY PLATFORM BİLGİSİ:
- Kuaför, berber, güzellik salonu, klinik, diyetisyen, kafe, restoran, oyun salonu ve her türlü randevulu/rezervasyonlu işletme kullanır.
- İşletmeler "randevory.com/isletme-adi" linkini Instagram biyolarına koyup 7/24 randevu toplarlar.
- Masa rezervasyonu modülü kafe ve restoranlar için aktiftir; berberlerde gereksiz kalabalık yapmasın diye varsayılan olarak gizlidir.
- Takvim motoru akıllıdır: Personelin çalışma saatlerine ve hizmetin süresine (örneğin 30 dk saç kesimi) göre bir sonraki randevu saatini otomatik öteler, çakışmayı %100 engeller.
- Müşterilere 4 haneli SMS onay kodu (OTP) gider, sahte numarayla veya başkasının adına randevu alınamaz.
- Gelmeyen (No-Show) müşteriler işletme tarafından tek tuşla Kara Listeye alınabilir ve bir daha o işletmeden randevu alamazlar.
- QR Kod ve Vitrin Afişi: Panelden tek tıkla baskıya hazır indirilip dükkanın camına asılabilir.
- Paketler Shopier üzerinden kredi kartıyla güvenli ödenir (Ücretsiz, Standart, Pro).
- Randevu iptali: Randevu sorgula/iptal sayfasından telefon numarasıyla saniyeler içinde yapılır.
- Şifre sıfırlama: Giriş ekranındaki "Şifremi Unuttum" bağlantısıyla e-posta üzerinden yapılır.

Cevapların genellikle 2-3 doğal ve amaca uygun cümle olsun. Kaba davranana taviz verme, saygılı olana en iyi desteği sun.
      `.trim();

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        const recent = history.slice(-6);
        for (const h of recent) {
          if (h.sender === 'user' && h.text) {
            contents.push({ role: 'user', parts: [{ text: h.text }] });
          } else if ((h.sender === 'admin' || h.sender === 'ai') && h.text) {
            contents.push({ role: 'model', parts: [{ text: h.text }] });
          }
        }
      }

      contents.push({ role: 'user', parts: [{ text: message }] });

      // Round-Robin başlangıç anahtarı
      const startKeyIndex = (globalKeyIndex++) % apiKeys.length;

      // Tüm anahtarlar havuzunda sırayla dön (Failover & Kota rotasyonu)
      for (let attempt = 0; attempt < apiKeys.length; attempt++) {
        const currentKeyIdx = (startKeyIndex + attempt) % apiKeys.length;
        const currentApiKey = apiKeys[currentKeyIdx];

        // Bu anahtar için aday modelleri dene
        for (const modelName of CANDIDATE_MODELS) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentApiKey}`;

            const genConfig: any = {
              temperature: 0.7,
              maxOutputTokens: 1000,
            };

            // thinkingConfig sadece 2.5 modellerinde desteklenir
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
                return NextResponse.json({
                  reply: generatedText.trim(),
                  source: 'gemini',
                  model: modelName,
                  keyPoolIndex: currentKeyIdx,
                });
              }
            } else if (res.status === 429 || res.status === 503) {
              // Kota aşıldı veya anlık yoğunluk: Bir sonraki API key'e hemen geç
              console.warn(
                `Key #${currentKeyIdx + 1} (${modelName}) got ${res.status}. Rotating to next key...`
              );
              break;
            } else if (res.status === 404) {
              // Model bu hesapta açık değil, bir sonraki modeli dene
              continue;
            } else {
              const errText = await res.text();
              console.warn(`Key #${currentKeyIdx + 1} API error:`, res.status, errText);
            }
          } catch (modelErr) {
            console.warn(`Key #${currentKeyIdx + 1} (${modelName}) fetch error:`, modelErr);
          }
        }
      }
    }

    // Akıllı yerel çözümleme motoru (Fallback)
    const resolution = solveSupportQuery(message);
    return NextResponse.json({
      reply: resolution.solution,
      source: 'fallback',
      quickActions: resolution.quickActions,
    });
  } catch (error: any) {
    console.error('Support AI Reply route error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
