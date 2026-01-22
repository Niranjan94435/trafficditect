import { supabase } from './supabaseClient';
import { TrafficStats, PollutionMetrics, HistoricalData } from '../types';

export interface TrafficAnalysis {
  id?: string;
  user_id: string;
  timestamp: string;
  pedestrians: number;
  cars: number;
  buses: number;
  trucks: number;
  bikes: number;
  animals: number;
  crowds: number;
  congestion: string;
  density: number;
  co2: number;
  nox: number;
  pm25: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

// Save traffic analysis to Supabase
export const saveTrafficAnalysis = async (userId: string, stats: TrafficStats, pollution: PollutionMetrics) => {
  try {
    const analysisData: TrafficAnalysis = {
      user_id: userId,
      timestamp: new Date().toISOString(),
      pedestrians: stats.pedestrians,
      cars: stats.cars,
      buses: stats.buses,
      trucks: stats.trucks,
      bikes: stats.bikes,
      animals: stats.animals,
      crowds: stats.crowds,
      congestion: stats.congestion,
      density: stats.density,
      co2: pollution.co2,
      nox: pollution.nox,
      pm25: pollution.pm25,
    };

    const { data, error } = await supabase
      .from('traffic_analysis')
      .insert([analysisData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error saving traffic analysis:', error);
    return { data: null, error: error.message };
  }
};

// Get user's traffic history
export const getUserTrafficHistory = async (userId: string, limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('traffic_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching traffic history:', error);
    return { data: [], error: error.message };
  }
};

// Get aggregated statistics for user
export const getUserStatistics = async (userId: string, days: number = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('traffic_analysis')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString());

    if (error) throw error;

    // Calculate averages
    if (!data || data.length === 0) {
      return {
        data: {
          avgCo2: 0,
          avgNox: 0,
          avgPm25: 0,
          avgDensity: 0,
          totalRecords: 0,
        },
        error: null,
      };
    }

    const avgStats = {
      avgCo2: data.reduce((sum, d) => sum + d.co2, 0) / data.length,
      avgNox: data.reduce((sum, d) => sum + d.nox, 0) / data.length,
      avgPm25: data.reduce((sum, d) => sum + d.pm25, 0) / data.length,
      avgDensity: data.reduce((sum, d) => sum + d.density, 0) / data.length,
      totalRecords: data.length,
    };

    return { data: avgStats, error: null };
  } catch (error: any) {
    console.error('Error fetching user statistics:', error);
    return { data: null, error: error.message };
  }
};

// Get or create user profile
export const getOrCreateUserProfile = async (userId: string, email: string, fullName: string) => {
  try {
    // First try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return { data: existingProfile, error: null };
    }

    // Create new profile if doesn't exist
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          email,
          full_name: fullName,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error managing user profile:', error);
    return { data: null, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, fullName: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { data: null, error: error.message };
  }
};
