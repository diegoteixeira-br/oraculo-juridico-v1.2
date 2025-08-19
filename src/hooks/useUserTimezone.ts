import { useAuth } from "@/contexts/AuthContext";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

export const useUserTimezone = () => {
  const { profile } = useAuth();
  const userTimezone = (profile as any)?.timezone || 'America/Sao_Paulo';

  const formatDateInUserTimezone = (date: Date | string, format: string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatInTimeZone(dateObj, userTimezone, format, { locale: ptBR });
  };

  const getCurrentDateInUserTimezone = () => {
    return new Date().toLocaleString('pt-BR', { 
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCurrentDateForAPI = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });
  };

  const formatTimeForAPI = (date: Date) => {
    return date.toISOString();
  };

  return {
    userTimezone,
    formatDateInUserTimezone,
    getCurrentDateInUserTimezone,
    getCurrentDateForAPI,
    formatTimeForAPI
  };
};