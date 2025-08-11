import React from 'npm:react@18.3.1'
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr } from 'npm:@react-email/components@0.0.22'

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
}

export const AgendaSummaryEmail = ({ fullName = '', items }: AgendaSummaryEmailProps) => {
  const sorted = [...items].sort(
    (a, b) => new Date(a.commitment_date as any).getTime() - new Date(b.commitment_date as any).getTime()
  )

  return (
    <Html>
      <Head />
      <Preview>Resumo diário da sua agenda</Preview>
      <Body style={main as any}>
        <Container style={container as any}>
          <Section style={hero as any}>
            <Heading style={brand as any}>Cakto</Heading>
            <Text style={subtitle as any}>Resumo diário da sua agenda</Text>
          </Section>

          <Section style={content as any}>
            <Text style={p as any}>
              {`Olá${fullName ? `, ${fullName}` : ''}! Aqui está o seu resumo de compromissos nas próximas 24 horas.`}
            </Text>
            <ul style={{ paddingLeft: 18, margin: '12px 0 16px', listStyle: 'disc' } as any}>
              {sorted.map((c, idx) => {
                const dt = new Date(c.commitment_date as any)
                const when = dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                const extra: string[] = []
                if (c.process_number) extra.push(`Processo: ${c.process_number}`)
                if (c.client_name) extra.push(`Cliente: ${c.client_name}`)
                if (c.location) extra.push(`Local: ${c.location}`)

                return (
                  <li key={idx} style={{ margin: '12px 0', padding: '0 4px' } as any}>
                    <strong>{c.title}</strong>
                    <div>{when}</div>
                    {extra.length > 0 && (
                      <div style={{ color: '#4b5563', marginTop: 2 } as any}>{extra.join(' | ')}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb' } as any} />
          <Section>
            <Text style={footer as any}>
              Você está recebendo este e-mail porque ativou notificações de agenda no Cakto. Para desativar, acesse sua conta.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f8fafc', padding: '24px' }
const container = {
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
}
const hero = { background: 'linear-gradient(135deg,#1e3a8a,#312e81)', color: '#ffffff', padding: '16px 20px' }
const brand = { fontSize: '18px', fontWeight: 700, letterSpacing: '0.2px', margin: 0 }
const subtitle = { fontSize: '12px', opacity: 0.9, margin: 0 }
const content = {
  padding: '20px 20px 8px',
  color: '#0f172a',
  fontFamily:
    'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif',
}
const p = { margin: '0 0 12px' }
const footer = { color: '#64748b', fontSize: '12px' }

export default AgendaSummaryEmail
