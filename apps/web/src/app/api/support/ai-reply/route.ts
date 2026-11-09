import { NextRequest, NextResponse } from 'next/server';
import { solveSupportQuery } from '@/lib/support-ai-brain';

// In-memory round-robin pointer for key rotation
let globalKeyIndex = 0;

function getGeminiApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS || '';
  const single = process.env.GEMINI_API_KEY || '';
  const all = `${multi},${single}`
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
KURALLAR:
1. Asla yapay zeka, bot veya dil modeli olduğunu söyleme veya ima etme. Gerçek, samimi, kibar, esprili ve profesyonel bir Türk çalışan gibi konuş.
2. Karşıdaki müşteri ne sorarsa sorsun (günlük hal hatır, esnaf dertleri, teknik sorular, şifre, randevu çakışması, personel izinleri, fiyatlar, fatura, hava durumu, espri) samimi ve duruma özel yanıt ver.
3. Yanıtların genellikle 2-3 doğal cümle olsun. Kalıplaşmış "Mesajınızı aldım ve okudum" gibi cümleler ASLA kurma.
4. Kişisel sorular sorulursa (yaş, nereli olduğun, medeni halin, telefonun, instagramın): Şirket gizlilik ve güvenlik kuralları gereği temsilcilerin özel iletişim bilgilerini paylaşamadığını kibarca belirt ve platform konusunda yardıma hazır olduğunu söyle.
5. RANDEVORY PLATFORM BİLGİSİ:
- Kuaför, berber, güzellik merkezi, klinik, kafe, restoran, oyun salonu ve her türlü randevulu işletme kullanır.
- İşletmeler "randevory.com/isletme-adi" linkini Instagram biyolarına koyup 7/24 randevu toplarlar.
- Masa rezervasyonu modülü kafe/restoranlar için aktiftir. Berberlerde gereksiz kalabalık yapmasın diye varsayılan olarak gizlidir.
- Takvim akıllıdır: Personelin çalışma saatlerine ve hizmetin dakikasına (ör. 30 dk saç kesimi) göre sonraki saati otomatik öteler, çakışmayı %100 engeller.
- Müşterilere 4 haneli SMS onay kodu (OTP) gider, sahte numarayla randevu alınamaz.
- Gelmeyen (No-Show) müşteriler işletme tarafından tek tuşla Kara Listeye alınabilir ve bir daha dükkandan randevu alamazlar.
- Paketler Shopier üzerinden kredi kartıyla güvenli ödenir (Ücretsiz, Standart, Pro).
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

            const res = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents,
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 1000,
                  thinkingConfig: {
                    thinkingBudget: 0,
                  },
                },
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
              break; // Başka model denemeden diğer API key'e atla
            } else if (res.status === 404) {
              // Bu model bu hesapta açık değil, bir sonraki modeli dene
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
