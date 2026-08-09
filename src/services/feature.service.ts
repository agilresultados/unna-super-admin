import { apiService } from './api';

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  votes: number;
  createdAt: string;
  updatedAt: string;
  hasUserVoted?: boolean;
  origem?: 'INTERNO' | 'CLIENTE';
  empresaId?: string | null;
  criadoPorUsuarioId?: string | null;
}

export interface CreateFeatureDto {
  title: string;
  description: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface UpdateFeatureDto {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface VoteFeatureDto {
  featureId: string;
}

export interface FeatureStats {
  totalFeatures: number;
  totalVotes: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  mostVotedFeature: string;
  mostVotedVotes: number;
}

export interface VoteResponse {
  message: string;
  voted: boolean;
}

class FeatureService {
  // Mapear status do backend para frontend
  private mapBackendToFrontend(backendFeature: any): Feature {
    const statusMap = {
      'PENDING': 'pending',
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'completed'
    } as const;

    return {
      ...backendFeature,
      status: statusMap[backendFeature.status as keyof typeof statusMap] || 'pending'
    };
  }

  // Mapear status do frontend para backend
  private mapFrontendToBackend(frontendStatus: string): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' {
    const statusMap = {
      'pending': 'PENDING',
      'in_progress': 'IN_PROGRESS',
      'completed': 'COMPLETED'
    } as const;

    return statusMap[frontendStatus as keyof typeof statusMap] || 'PENDING';
  }

  async getAllFeatures(): Promise<Feature[]> {
    const backendFeatures = await apiService.get<any[]>('/features');
    return backendFeatures.map(feature => this.mapBackendToFrontend(feature));
  }

  async getFeatureById(id: string): Promise<Feature> {
    const backendFeature = await apiService.get<any>(`/features/${id}`);
    return this.mapBackendToFrontend(backendFeature);
  }

  async createFeature(data: CreateFeatureDto): Promise<Feature> {
    // Converter status do frontend para backend antes de enviar
    const backendData = {
      title: data.title,
      description: data.description,
      status: data.status ? this.mapFrontendToBackend(data.status) : undefined
    };
    
    const backendFeature = await apiService.post<any>('/features', backendData);
    return this.mapBackendToFrontend(backendFeature);
  }

  // Usado pelo admin do salão para solicitar uma melhoria pela área de Suporte (vira um "chamado")
  async solicitarMelhoria(data: { title: string; description: string }): Promise<Feature> {
    const backendFeature = await apiService.post<any>('/features/solicitar', data);
    return this.mapBackendToFrontend(backendFeature);
  }

  async updateFeature(id: string, data: UpdateFeatureDto): Promise<Feature> {
    // Converter status do frontend para backend antes de enviar
    const backendData = {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.status && { status: this.mapFrontendToBackend(data.status) })
    };
    
    const backendFeature = await apiService.put<any>(`/features/${id}`, backendData);
    return this.mapBackendToFrontend(backendFeature);
  }

  async deleteFeature(id: string): Promise<void> {
    return apiService.delete(`/features/${id}`);
  }

  async voteFeature(data: VoteFeatureDto): Promise<VoteResponse> {
    return apiService.post<VoteResponse>('/features/vote', data);
  }

  async updateFeatureStatus(id: string, status: 'pending' | 'in_progress' | 'completed'): Promise<Feature> {
    const backendStatus = this.mapFrontendToBackend(status);
    const backendFeature = await apiService.put<any>(`/features/${id}/status`, { status: backendStatus });
    return this.mapBackendToFrontend(backendFeature);
  }

  async getFeatureStats(): Promise<FeatureStats> {
    return apiService.get<FeatureStats>('/features/stats');
  }
}

export const featureService = new FeatureService();
