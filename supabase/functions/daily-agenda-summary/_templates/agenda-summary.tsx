import React from 'npm:react@18.3.1'

export type CommitmentItem = {
  title: string
  commitment_date: string | Date
  location?: string | null
  process_number?: string | null
  client_name?: string | null
}

export interface AgendaSummaryEmailProps {
  fullName?: string
  items: CommitmentItem[]
  timezone?: string
  customTemplate?: string
}

export const AgendaSummaryEmail = ({ fullName = '', items, timezone = 'America/Sao_Paulo', customTemplate }: AgendaSummaryEmailProps) => {
  const sorted = [...items].sort(
    (a, b) => new Date(a.commitment_date as any).getTime() - new Date(b.commitment_date as any).getTime()
  )

  // Se temos um template customizado, vamos usar ele
  if (customTemplate) {
    const commitmentsHtml = sorted.map(c => {
      const dt = new Date(c.commitment_date as any)
      const when = dt.toLocaleString('pt-BR', { 
        dateStyle: 'short', 
        timeStyle: 'short',
        timeZone: timezone 
      })
      const extra: string[] = []
      if (c.process_number) extra.push(`Processo: ${c.process_number}`)
      if (c.client_name) extra.push(`Cliente: ${c.client_name}`)
      if (c.location) extra.push(`Local: ${c.location}`)

      return `
        <div class="commitment">
            <div class="commitment-title">${c.title}</div>
            <div class="commitment-time">📅 ${when}</div>
            ${extra.length > 0 ? `<div class="commitment-details">${extra.join(' • ')}</div>` : ''}
        </div>
      `
    }).join('')

    return customTemplate
      .replace(/\{\{SITE_NAME\}\}/g, 'Cakto')
      .replace(/\{\{USER_NAME\}\}/g, fullName ? `, ${fullName}` : '')
      .replace(/\{\{COMMITMENTS\}\}/g, commitmentsHtml)
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Resumo da Agenda Jurídica</title>
    <style>
        body {
            margin: 0;
            padding: 24px;
            background-color: #f8fafc;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
            max-width: 640px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a, #312e81);
            color: #ffffff;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px 0;
            letter-spacing: 0.5px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
            margin: 0;
        }
        .content {
            padding: 32px 24px;
            color: #0f172a;
        }
        .greeting {
            font-size: 16px;
            margin: 0 0 24px 0;
            line-height: 1.6;
        }
        .commitments {
            margin: 24px 0;
        }
        .commitment {
            background: #f8fafc;
            border-left: 4px solid #1e3a8a;
            padding: 16px;
            margin: 12px 0;
            border-radius: 8px;
        }
        .commitment-title {
            font-weight: 600;
            color: #1e3a8a;
            font-size: 16px;
            margin: 0 0 8px 0;
        }
        .commitment-time {
            color: #374151;
            font-size: 14px;
            margin: 4px 0;
        }
        .commitment-details {
            color: #6b7280;
            font-size: 13px;
            margin: 8px 0 0 0;
        }
        .footer {
            border-top: 1px solid #e5e7eb;
            padding: 20px 24px;
            background: #f9fafb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Cakto</h1>
            <p>Resumo da Agenda Jurídica</p>
        </div>
        
        <div class="content">
            <p class="greeting">
                Olá${fullName ? `, <strong>${fullName}</strong>` : ''}! 
                Aqui está o seu resumo de compromissos nas próximas 24 horas:
            </p>
            
            <div class="commitments">
                ${sorted.map(c => {
                  const dt = new Date(c.commitment_date as any)
                  const when = dt.toLocaleString('pt-BR', { 
                    dateStyle: 'short', 
                    timeStyle: 'short',
                    timeZone: timezone 
                  })
                  const extra: string[] = []
                  if (c.process_number) extra.push(`Processo: ${c.process_number}`)
                  if (c.client_name) extra.push(`Cliente: ${c.client_name}`)
                  if (c.location) extra.push(`Local: ${c.location}`)

                  return `
                    <div class="commitment">
                        <div class="commitment-title">${c.title}</div>
                        <div class="commitment-time">📅 ${when}</div>
                        ${extra.length > 0 ? `<div class="commitment-details">${extra.join(' • ')}</div>` : ''}
                    </div>
                  `
                }).join('')}
            </div>
        </div>
        
        <div class="footer">
            Você está recebendo este e-mail porque ativou notificações de agenda no Cakto.<br>
            Para gerenciar suas notificações, acesse sua conta.
        </div>
    </div>
</body>
</html>`

  return htmlContent
}

export default AgendaSummaryEmail
