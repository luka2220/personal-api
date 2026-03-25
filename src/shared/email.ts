import { EmailMessage } from 'cloudflare:email';

import type { MIMEMessage } from 'mimetext';
import { createMimeMessage } from 'mimetext';

interface EmailConfigSettings {
  senderName: string;
  subject: string;
  messageContentType: string; // "text/plain"
  data: string;
}

export class EmailService {
  recipient: string;
  sender: string;
  cfEmailSender: SendEmail;

  private messageConfig: MIMEMessage | null = null;
  private message: EmailMessage | null = null;

  constructor(recipient: string, sender: string, cfEmailSender: SendEmail) {
    this.recipient = recipient;
    this.sender = sender;
    this.cfEmailSender = cfEmailSender;
  }

  config(config: EmailConfigSettings) {
    this.messageConfig = createMimeMessage();

    this.messageConfig.setSender({
      name: config.senderName,
      addr: this.sender,
    });
    this.messageConfig.setRecipient(this.recipient);
    this.messageConfig.setSubject(config.subject);
    this.messageConfig.addMessage({
      contentType: config.messageContentType,
      data: config.data,
    });

    this.message = new EmailMessage(
      'daily-diff@lukapiplica.net',
      'piplicaluka64@gmail.com',
      this.messageConfig.asRaw()
    );

    return this;
  }

  /**
   * @throws {Error}
   */
  async send() {
    if (!this.message) {
      throw new Error(
        `Missing email config: ${JSON.stringify(this.messageConfig)}`
      );
    }
    await this.cfEmailSender.send(this.message);
  }
}
