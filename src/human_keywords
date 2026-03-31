const HUMAN_KEYWORDS = {
  ko: ['사람', '직원', '상담원', '도움말', '연결해줘', '사람이랑 얘기'],
  en: ['human', 'agent', 'staff', 'real person', 'help me', 'connect me', 'talk to someone'],
  vi: ['người thật', 'nhân viên', 'hỗ trợ trực tiếp'],
  id: ['manusia', 'petugas', 'staf', 'bantuan langsung'],
  mn: ['хүн', 'ажилтан', 'холбоно уу'],
};

const FAIL_THRESHOLD = 3; // N회 실패 시 자동 호출

export function isHumanRequest(text = '') {
  const t = text.toLowerCase();
  return Object.values(HUMAN_KEYWORDS).flat().some(k => t.includes(k.toLowerCase()));
}

// 세션에 실패 횟수 누적
export function incrementFailCount(session) {
  session.failCount = (session.failCount || 0) + 1;
  return session.failCount;
}

export function resetFailCount(session) {
  session.failCount = 0;
}

export function shouldEscalate(session) {
  return (session.failCount || 0) >= FAIL_THRESHOLD;
}

// LINE으로 도우미에게 알림
export async function notifyHumanViaLine({ userId, userMessage, lang, reason }) {
  const HELPER_LINE_ID = process.env.HELPER_LINE_USER_ID;
  const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!HELPER_LINE_ID || !LINE_ACCESS_TOKEN) {
    console.error('HELPER_LINE_USER_ID or LINE_CHANNEL_ACCESS_TOKEN not set');
    return false;
  }

  const reasonLabel = {
    keyword: '사용자 직접 요청',
    ai_fail: 'AI 해결 불가 감지',
    threshold: `대화 실패 ${FAIL_THRESHOLD}회 초과`,
  }[reason] || reason;

  const message = [
    `🔔 도우미 호출`,
    `📌 사유: ${reasonLabel}`,
    `🌐 언어: ${lang}`,
    `👤 사용자 ID: ${userId}`,
    `💬 마지막 메시지: ${userMessage}`,
    `🕐 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
  ].join('\n');

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: HELPER_LINE_ID,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!res.ok) {
      console.error('LINE push failed:', await res.text());
      return false;
    }

    console.log(`[HUMAN] Notified helper via LINE. reason=${reason}, userId=${userId}`);
    return true;
  } catch (err) {
    console.error('[HUMAN] notifyHumanViaLine error:', err);
    return false;
  }
}

// 사용자에게 보낼 응답
export function humanRequestReply(lang, reason) {
  const isEmergency = reason === 'threshold' || reason === 'ai_fail';

  const msgs = {
    en: isEmergency
      ? `🙏 It seems I'm having trouble helping you. I've notified a human assistant — they'll reach out to you shortly!`
      : `👤 Got it! I've connected you with a human assistant. They'll be with you shortly.`,
    vi: isEmergency
      ? `🙏 Có vẻ tôi gặp khó khăn trong việc hỗ trợ bạn. Đã thông báo cho nhân viên — họ sẽ liên hệ sớm!`
      : `👤 Đã hiểu! Đã kết nối với nhân viên hỗ trợ. Họ sẽ liên hệ sớm.`,
    id: isEmergency
      ? `🙏 Sepertinya saya kesulitan membantu Anda. Asisten manusia telah diberitahu — mereka akan segera menghubungi!`
      : `👤 Mengerti! Menghubungkan Anda dengan asisten manusia. Mereka akan segera hadir.`,
    mn: isEmergency
      ? `🙏 Таньд тусалахад бэрхшээл гарч байна. Хүний туслахад мэдэгдлээ — тэд удахгүй холбогдоно!`
      : `👤 Ойлголоо! Хүний туслахтай холбож байна. Тэд удахгүй холбогдоно.`,
  };

  return msgs[lang] || msgs.en;
}
