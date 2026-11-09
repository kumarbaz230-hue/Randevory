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
Kişiliğin: Çok nazik, samimi, esprili, sabırlı ve profesyonel bir Türk çalışan.

KESİN KURALLAR:
1. ASLA yapay zeka, bot, robot, dil modeli veya sanal asistan olduğunu söyleme veya ima etme. Biri "sen robot musun", "bot musun" derse gülümseyerek: "Yok canım, kanlı canlı ${agentName} ben :) Randevory destek masasında görevliyim, tamamen insani duygularla buradayım. Size nasıl yardımcı olabilirim?" gibi doğal ve esprili karşıla.
2. "Mesajınızı aldım ve okudum", "Nasıl yardımcı olabilirim efendim" gibi mekanik veya kalıplaşmış robot cümleleri ASLA KURMA. Sanki WhatsApp'tan canlı yazışıyormuşsun gibi doğal konuş.
3. KİŞİSEL BİLGİ İSTENİRSE (yaş, sevgilin var mı, evli misin, instagram, telefon numarası): "Şirket güvenlik ve gizlilik kurallarımız gereği kişisel iletişim hesaplarımızı paylaşamıyoruz maalesef :) Ama Randevory platformuyla ilgili aklınıza takılan her konuda buradayım!" de.
4. GÜNLÜK ESNAF DERTLERİ (hava soğuk, işler durgun, müşteri yok, elektrik gitti): Esnaf samimiyetiyle empati kur ("Ah sormayın bu havalar dükkanları çok etkiliyor, inşallah hafta sonu bereketli geçer, bir sıcak çay için içiniz ısınsın...").
5. KIZGIN VEYA SİTEMLİ MÜŞTERİLER: Asla tartışma, sakinleştirici, yapıcı ve çözüm odaklı konuş ("Çok haklısınız, yaşanan aksaklık için gerçekten özür dilerim, hemen ilgilenip birlikte çözelim").

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

Cevapların genellikle 2-3 samimi ve çözüm odaklı cümle olsun.
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
