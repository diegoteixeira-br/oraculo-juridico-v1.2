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
}

export const AgendaSummaryEmail = ({ fullName = '', items, timezone = 'America/Sao_Paulo' }: AgendaSummaryEmailProps) => {
  const sorted = [...items].sort(
    (a, b) => new Date(a.commitment_date as any).getTime() - new Date(b.commitment_date as any).getTime()
  )

  return React.createElement('html', { lang: 'pt-BR' }, 
    React.createElement('head', {},
      React.createElement('meta', { charSet: 'utf-8' }),
      React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      React.createElement('title', {}, 'Resumo da Agenda Jurídica')
    ),
    React.createElement('body', { style: { backgroundColor: '#f8fafc', margin: 0, padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' } },
      React.createElement('div', { style: { maxWidth: '640px', margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' } },
        // Header
        React.createElement('div', { style: { background: 'linear-gradient(135deg, #1e3a8a, #312e81)', color: '#ffffff', padding: '16px 20px' } },
          React.createElement('h1', { style: { fontSize: '18px', fontWeight: '700', margin: 0 } }, 'Cakto'),
          React.createElement('p', { style: { fontSize: '12px', opacity: 0.9, margin: 0 } }, 'Resumo diário da sua agenda')
        ),
        // Content
        React.createElement('div', { style: { padding: '20px', color: '#0f172a' } },
          React.createElement('p', { style: { margin: '0 0 16px' } }, 
            `Olá${fullName ? `, ${fullName}` : ''}! Aqui está o seu resumo de compromissos nas próximas 24 horas.`
          ),
          React.createElement('ul', { style: { paddingLeft: '18px', margin: '16px 0', listStyle: 'disc' } },
            ...sorted.map((c, idx) => {
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

              return React.createElement('li', { key: idx, style: { margin: '12px 0', padding: '0 4px' } },
                React.createElement('strong', {}, c.title),
                React.createElement('div', {}, when),
                extra.length > 0 && React.createElement('div', { style: { color: '#4b5563', marginTop: '2px' } }, extra.join(' | '))
              )
            })
          ),
          React.createElement('hr', { style: { borderColor: '#e5e7eb', margin: '20px 0' } }),
          React.createElement('p', { style: { color: '#64748b', fontSize: '12px', margin: 0 } },
            'Você está recebendo este e-mail porque ativou notificações de agenda no Cakto. Para desativar, acesse sua conta.'
          )
        )
      )
    )
  )
}

export default AgendaSummaryEmail
