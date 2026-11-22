export interface PushDevice { id: string; platform: string; enabled: boolean; updatedAt: Date }
export interface PushRepository {
  register(userId: string, token: string, platform: 'android' | 'ios'): Promise<PushDevice>;
  list(userId: string): Promise<PushDevice[]>;
  remove(userId: string, id: string): Promise<boolean>;
}
