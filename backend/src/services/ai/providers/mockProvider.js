export class MockProvider {
  async analyzeMessage({ message, business, settings }) {
    const text = message.toLowerCase();
    const isBooking = /(schedule|book|appointment|come by|visit|available|tomorrow|today)/i.test(text);
    const isComplaint = /(complaint|angry|upset|broken|too cold|too hot|again|refund)/i.test(text);
    const isReminder = /(remind|reminder|follow up|notify)/i.test(text);
    const intent = isBooking ? 'booking' : isComplaint ? 'complaint' : isReminder ? 'reminder' : 'question';
    const title = intent === 'booking'
      ? 'Schedule service appointment'
      : intent === 'complaint'
        ? 'Review customer complaint'
        : intent === 'reminder'
          ? 'Create reminder'
          : 'Respond to customer question';

    return {
      intent,
      confidence: isBooking || isComplaint || isReminder ? 0.88 : 0.72,
      reply: `Hi, this is ${settings.assistant_name} with ${business.name}. Thanks for reaching out. ${this.replyTail(intent)}`,
      actions: {
        createTask: true,
        task: {
          title,
          description: message,
          priority: isComplaint || isBooking ? 'high' : 'medium'
        },
        appointment: isBooking
          ? {
              title: 'Service appointment request',
              description: message,
              startOffsetHours: 24,
              durationMinutes: 120
            }
          : null
      }
    };
  }

  replyTail(intent) {
    if (intent === 'booking') return 'I can help find the next available appointment window and have the team confirm it shortly.';
    if (intent === 'complaint') return 'I am flagging this for quick review so the team can make it right.';
    if (intent === 'reminder') return 'I will help turn this into a reminder so it does not slip through the cracks.';
    return 'I will get this to the right person and follow up with the next step.';
  }
}
