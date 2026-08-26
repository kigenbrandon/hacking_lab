import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Machine, MachineSolve, CtfChallenge, CtfSolve, UserProfile, LeaderboardEntry } from '@/lib/types';
import { getRank } from '@/lib/ranks';

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [solves, setSolves] = useState<MachineSolve[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchAll() {
      const [machRes, solveRes] = await Promise.all([
        supabase.from('machines').select('*').order('difficulty'),
        user
          ? supabase.from('machine_solves').select('*')
          : Promise.resolve({ data: null }),
      ]);
      if (machRes.data) setMachines(machRes.data);
      if (solveRes.data) setSolves(solveRes.data);
      setLoading(false);
    }
    fetchAll();
  }, [user]);

  const submitFlag = useCallback(
    async (machine: Machine, flag: string, tier: 'user' | 'system'): Promise<{ success: boolean; message: string }> => {
      if (!user) return { success: false, message: 'Sign in to submit flags.' };
      const expected = tier === 'user' ? machine.user_flag : machine.system_flag;
      if (flag.trim() !== expected) {
        return { success: false, message: 'Incorrect flag. Try again.' };
      }
      const { data: existing } = await supabase
        .from('machine_solves')
        .select('id')
        .eq('machine_id', machine.id)
        .eq('tier', tier)
        .maybeSingle();
      if (existing) {
        return { success: false, message: 'You already submitted this flag.' };
      }
      const { error } = await supabase.from('machine_solves').insert({
        machine_id: machine.id,
        tier,
      });
      if (error) return { success: false, message: 'Failed to record solve.' };

      setSolves((prev) => [...prev, { id: 'temp', user_id: user.id, machine_id: machine.id, tier, solved_at: new Date().toISOString() }]);

      const points = tier === 'system' ? machine.points * 2 : machine.points;
      await updateProfilePoints(user.id, points);
      return { success: true, message: `Flag accepted! +${points} points` };
    },
    [user]
  );

  return { machines, solves, loading, submitFlag };
}

export function useCtfChallenges() {
  const [challenges, setChallenges] = useState<CtfChallenge[]>([]);
  const [solves, setSolves] = useState<CtfSolve[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchAll() {
      const [challRes, solveRes] = await Promise.all([
        supabase.from('ctf_challenges').select('*').order('difficulty'),
        user
          ? supabase.from('ctf_solves').select('*')
          : Promise.resolve({ data: null }),
      ]);
      if (challRes.data) setChallenges(challRes.data);
      if (solveRes.data) setSolves(solveRes.data);
      setLoading(false);
    }
    fetchAll();
  }, [user]);

  const submitFlag = useCallback(
    async (challenge: CtfChallenge, flag: string): Promise<{ success: boolean; message: string }> => {
      if (!user) return { success: false, message: 'Sign in to submit flags.' };
      if (flag.trim() !== challenge.flag_hash) {
        return { success: false, message: 'Incorrect flag. Try again.' };
      }
      const { data: existing } = await supabase
        .from('ctf_solves')
        .select('id')
        .eq('challenge_id', challenge.id)
        .maybeSingle();
      if (existing) {
        return { success: false, message: 'You already solved this challenge.' };
      }
      const { error } = await supabase.from('ctf_solves').insert({
        challenge_id: challenge.id,
      });
      if (error) return { success: false, message: 'Failed to record solve.' };

      setSolves((prev) => [...prev, { id: 'temp', user_id: user.id, challenge_id: challenge.id, solved_at: new Date().toISOString() }]);

      await updateProfilePoints(user.id, challenge.points);
      return { success: true, message: `Flag accepted! +${challenge.points} points` };
    },
    [user]
  );

  return { challenges, solves, loading, submitFlag };
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchAll() {
      const [lbRes, profileRes] = await Promise.all([
        supabase.from('leaderboard').select('*').limit(100),
        user
          ? supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (lbRes.data) setEntries(lbRes.data);
      if (profileRes.data) setMyProfile(profileRes.data);
      setLoading(false);
    }
    fetchAll();
  }, [user]);

  return { entries, myProfile, loading };
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (!data) {
        const { data: created } = await supabase
          .from('user_profiles')
          .insert({ id: user.id })
          .select('*')
          .maybeSingle();
        setProfile(created);
      } else {
        setProfile(data);
      }
      setLoading(false);
    })();
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, 'bio' | 'country'>>) => {
      if (!user || !profile) return;
      const { data } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select('*')
        .maybeSingle();
      if (data) setProfile(data);
    },
    [user, profile]
  );

  return { profile, loading, updateProfile, setProfile };
}

async function updateProfilePoints(userId: string, pointsToAdd: number) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from('user_profiles').insert({
      id: userId,
      total_points: pointsToAdd,
    });
  } else {
    const newPoints = profile.total_points + pointsToAdd;
    const rank = getRank(newPoints);
    await supabase
      .from('user_profiles')
      .update({
        total_points: newPoints,
        rank_title: rank.title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
}
