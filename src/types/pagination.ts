export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  servicoId?: string;
  dataDesejada?: string;
  horario?: string;
  localizacao?: string;
  preferenciaHorario?: string;
  preferenciaFinalSemana?: boolean;
}

export interface PaginatedResponse<T> {
  dados: T[];
  total: number;
  page: number;
  lastPage: number;
}
