import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  status?: string;
  statusLabel?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    // If SMTP is not configured, use a mock transporter for development
    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured. Emails will be logged to console.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    // Verify connection
    this.transporter.verify((error: Error | null) => {
      if (error) {
        this.logger.error('SMTP connection failed:', error.message);
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    // Check if templates directory exists
    if (!fs.existsSync(templatesDir)) {
      this.logger.warn('Templates directory not found. Using inline templates.');
      return;
    }

    const templateFiles = fs
      .readdirSync(templatesDir)
      .filter((f) => f.endsWith('.hbs'));

    templateFiles.forEach((file) => {
      const templateName = path.basename(file, '.hbs');
      const templatePath = path.join(templatesDir, file);
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      this.templates.set(templateName, handlebars.compile(templateSource));
      this.logger.log(`Loaded email template: ${templateName}`);
    });
  }

  private getTemplate(name: string): handlebars.TemplateDelegate {
    const template = this.templates.get(name);
    if (template) {
      return template;
    }

    // Return a basic fallback template
    return handlebars.compile(`
      <html>
        <body>
          <h1>{{title}}</h1>
          <p>{{message}}</p>
        </body>
      </html>
    `);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, template, context } = options;
    const fromEmail =
      this.configService.get<string>('SMTP_FROM') || 'noreply@dynnamo.com';
    const appName = this.configService.get<string>('APP_NAME') || 'Dynnamo';

    try {
      const templateFn = this.getTemplate(template);
      const html = templateFn({ ...context, appName });

      if (!this.transporter) {
        // Development mode: log email to console
        this.logger.log('='.repeat(50));
        this.logger.log(`EMAIL TO: ${to}`);
        this.logger.log(`SUBJECT: ${subject}`);
        this.logger.log(`TEMPLATE: ${template}`);
        this.logger.log(`CONTEXT: ${JSON.stringify(context, null, 2)}`);
        this.logger.log('='.repeat(50));
        return true;
      }

      await this.transporter.sendMail({
        from: `"${appName}" <${fromEmail}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}:`, errorMessage);
      return false;
    }
  }

  // ==================== SPECIFIC EMAIL METHODS ====================

  /**
   * Send welcome email on registration
   */
  async sendWelcomeEmail(name: string, email: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Bienvenido a Dynnamo',
      template: 'welcome',
      context: {
        name,
        loginUrl: this.configService.get<string>('FRONTEND_URL') + '/login',
      },
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    return this.sendEmail({
      to: data.customerEmail,
      subject: `Pedido #${data.orderId.slice(0, 8)} confirmado`,
      template: 'order-confirmation',
      context: {
        orderId: data.orderId.slice(0, 8),
        customerName: data.customerName,
        items: data.items,
        total: data.total.toFixed(2),
        orderUrl: `${this.configService.get<string>('FRONTEND_URL')}/orders/${data.orderId}`,
      },
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(data: OrderEmailData): Promise<boolean> {
    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Tu pedido ha sido confirmado y esta siendo preparado.',
      SHIPPED: 'Tu pedido ha sido enviado y esta en camino.',
      DELIVERED: 'Tu pedido ha sido entregado. Gracias por tu compra!',
      CANCELLED: 'Tu pedido ha sido cancelado.',
    };

    const status = data.status || 'PENDING';
    const statusMessage =
      statusMessages[status] || 'El estado de tu pedido ha cambiado.';

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Pedido #${data.orderId.slice(0, 8)} - ${data.statusLabel}`,
      template: 'order-status',
      context: {
        orderId: data.orderId.slice(0, 8),
        customerName: data.customerName,
        status: data.status,
        statusLabel: data.statusLabel,
        statusMessage,
        items: data.items,
        total: data.total.toFixed(2),
        orderUrl: `${this.configService.get<string>('FRONTEND_URL')}/orders/${data.orderId}`,
      },
    });
  }
}
