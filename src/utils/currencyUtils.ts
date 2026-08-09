/**
 * Tipos de moedas suportadas
 */
export type CurrencyType = 'BRL' | 'EUR';

/**
 * Mapeamento de configuração por moeda
 */
const currencyConfigs = {
    BRL: { locale: 'pt-BR', symbol: 'R$', code: 'BRL' },
    EUR: { locale: 'pt-PT', symbol: '€', code: 'EUR' }
};

/**
 * Obtém a configuração de moeda atual. Por padrão retorna BRL.
 */
export const getCurrencyConfig = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            
            // Se a empresa já estiver no localStorage (como no AdminLayout)
            const empresaStr = localStorage.getItem('empresa_config');
            if (empresaStr) {
                const empresa = JSON.parse(empresaStr);
                if (empresa.endereco?.pais?.toLowerCase() === 'portugal') return currencyConfigs.EUR;
            }

            // Fallback para sobrescrita manual
            const manualCurrency = localStorage.getItem('app_currency');
            if (manualCurrency === 'EUR') return currencyConfigs.EUR;
        }
    } catch (e) {}
    
    return currencyConfigs.BRL;
};

/**
 * Formata um número para o formato de moeda configurado.
 * Ex: 1234.56 -> 1.234,56 (BRL) ou 1 234,56 € (EUR)
 */
export const formatCurrency = (value: number, currency: CurrencyType = 'BRL'): string => {
    const config = currencyConfigs[currency] || currencyConfigs.BRL;
    
    return new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

/**
 * Formato simplificado que usa as configurações globais da aplicação
 */
export const formatCurrencyDynamic = (value: number): string => {
    const config = getCurrencyConfig();
    return new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: config.code
    }).format(value || 0);
};

/**
 * Obtém a configuração de moeda baseada em um país.
 */
export const getCurrencyConfigByCountry = (country?: string) => {
    if (country?.toLowerCase() === 'portugal') return currencyConfigs.EUR;
    return currencyConfigs.BRL;
};

/**
 * Formata um valor baseado no país informado.
 */
export const formatCurrencyByCountry = (value: number, country?: string): string => {
    const config = getCurrencyConfigByCountry(country);
    return new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: config.code
    }).format(value || 0);
};

/**
 * Remove a formatação de moeda e retorna o valor numérico.
 */
export const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) return 0;
    return parseFloat(cleanValue) / 100;
};

/**
 * Aplica a máscara de moeda durante a digitação.
 */
export const maskCurrency = (value: string, currency: CurrencyType = 'BRL'): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '0,00';

    const amount = parseFloat(numericValue) / 100;
    return formatCurrency(amount, currency);
};
