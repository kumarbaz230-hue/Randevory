import { NextRequest, NextResponse } from 'next/server';
import { SUPPORT_AGENTS, solveSupportQuery } from '@/lib/support-ai-brain';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentName = 'Esma', history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Google Gemini 2.5 Flash
    if (apiKey) {
      try {
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

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
            // Find text part
            for (const p of parts) {
              if (p.text) generatedText += p.text;
            }
          }
          if (generatedText && generatedText.trim()) {
            return NextResponse.json({
              reply: generatedText.trim(),
              source: 'gemini',
            });
          }
        } else {
          const errText = await res.text();
          console.error('Gemini API response error:', res.status, errText);
        }
      } catch (geminiErr) {
        console.error('Gemini call error:', geminiErr);
      }
    }

    // 2. Intelligent Fallback if API call fails
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
