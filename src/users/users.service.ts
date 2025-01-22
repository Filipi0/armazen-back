import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  async findAll() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw new Error(error.message);
    return data;
  }

  async findByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async createUser(email: string, senha: string) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, senha }]);
    if (error) throw new Error(error.message);
    return data;
  }

  async updateUser(id: number, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteUser(id: number) {
    const { data, error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return data;
  }
}
