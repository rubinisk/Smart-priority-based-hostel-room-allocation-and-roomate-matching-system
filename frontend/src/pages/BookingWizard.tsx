import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hostel, Room, Application } from '../types';
import { apiFetch } from '../api/client';
import { ProgressBar } from '../components/ProgressBar';
import { TermsModal } from '../components/TermsModal';
import {
  Users, CheckCircle2, AlertCircle, Heart, Home, ArrowRight, ArrowLeft,
  Search, Check, ShieldAlert, Sparkles, Building2, ShieldCheck, FileText,
  Clock, X, RefreshCw, UserCheck, UserX, UserPlus, Edit3, Trash2, ArrowUpRight
} from 'lucide-react';

interface InvitedMemberInfo {
  invitation_id: number;
  membership_status: 'pending' | 'accepted' | 'rejected';
  leader_name: string;
  leader_roll: string;
  group_size: number;
  group_id?: number;
}

interface MyGroupMember {
  member_id: number;
  student_id: number;
  roll_number: string;
  name: string;
  gender: string;
  status: 'accepted' | 'pending' | 'rejected';
  is_leader: boolean;
  responded_at?: string | null;
}

interface MyGroup {
  in_group: boolean;
  role: 'leader' | 'member' | 'none';
  group_id: number | null;
  group_size: number;
  status: string | null;
  all_accepted: boolean;
  has_rejected: boolean;
  has_pending: boolean;
  members: MyGroupMember[];
}

export const BookingWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard mode: 'new' (first booking), 'review' (view existing submission), 'edit' (modifying existing submission)
  const [wizardMode, setWizardMode] = useState<'new' | 'review' | 'edit'>('new');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [existingApp, setExistingApp] = useState<Application | null>(null);
  const [invitedMemberInfo, setInvitedMemberInfo] = useState<InvitedMemberInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedRegNum, setSubmittedRegNum] = useState<string | null>(null);

  // Hostels and Rooms state
  const [eligibleHostels, setEligibleHostels] = useState<Hostel[]>([]);
  const [pref1Rooms, setPref1Rooms] = useState<Room[]>([]);

  // Step 1: Roommate state
  const [stayWithFriends, setStayWithFriends] = useState<boolean | null>(null);
  const [numFriends, setNumFriends] = useState<number>(1); // 1, 2, or 3 friends (2, 3, 4 total)
  const [friendRollInputs, setFriendRollInputs] = useState<string[]>(['']);
  const [myGroup, setMyGroup] = useState<MyGroup | null>(null);
  const [sendingInviteIndex, setSendingInviteIndex] = useState<number | null>(null);
  const [inviteErrors, setInviteErrors] = useState<{ [key: number]: string }>({});
  const [refreshingGroup, setRefreshingGroup] = useState<boolean>(false);

  // Total group size: 1 if individual, else numFriends + 1
  const totalGroupSize = stayWithFriends ? (numFriends + 1) : 1;

  // Step 2: 3 Hostel Preferences state (Same hostel with different sharing is allowed)
  const [preferences, setPreferences] = useState<{
    rank: number;
    hostel_id: number | null;
    sharing_type: number | null;
  }[]>([
    { rank: 1, hostel_id: null, sharing_type: null },
    { rank: 2, hostel_id: null, sharing_type: null },
    { rank: 3, hostel_id: null, sharing_type: null },
  ]);

  // Step 3: Room Choices state (matching reference design)
  const [wantSpecificRooms, setWantSpecificRooms] = useState<boolean>(true);
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [roomSearchTerm, setRoomSearchTerm] = useState<string>('');
  const [pref2Floors, setPref2Floors] = useState<number[]>([1, 2, 3, 4]);
  const [pref3Floors, setPref3Floors] = useState<number[]>([1, 2, 3, 4]);

  // Step 4: Terms & Conditions state
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  // Initialize Wizard: Check application & invitations
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    const initWizard = async () => {
      try {
        setLoading(true);
        // Check existing application or group membership
        const appRes = await apiFetch<{
          has_application: boolean;
          can_modify?: boolean;
          application: Application | null;
          in_group_invitation?: boolean;
          group_role?: 'leader' | 'member';
          membership_status?: 'pending' | 'accepted' | 'rejected';
          invitation_id?: number;
          group_id?: number;
          leader_name?: string;
          leader_roll?: string;
          group_size?: number;
        }>('/student/application');

        if (appRes.has_application && appRes.application) {
          setExistingApp(appRes.application);
          setWizardMode('review');
        } else if (appRes.in_group_invitation && appRes.group_role === 'member') {
          setInvitedMemberInfo({
            invitation_id: appRes.invitation_id || 0,
            membership_status: (appRes.membership_status as any) || 'pending',
            leader_name: appRes.leader_name || 'Group Leader',
            leader_roll: appRes.leader_roll || '',
            group_size: appRes.group_size || 2,
            group_id: appRes.group_id,
          });
        } else {
          setWizardMode('new');
        }

        // Fetch eligible hostels
        const hRes = await apiFetch<{ hostels: Hostel[] }>('/student/hostels');
        setEligibleHostels(hRes.hostels);

        // Fetch existing group if user is already a leader
        const groupRes = await apiFetch<MyGroup>('/student/group/my-group');
        if (groupRes.in_group && groupRes.role === 'leader') {
          setMyGroup(groupRes);
          if (!appRes.has_application) {
            setStayWithFriends(true);
            const friendCount = Math.max(1, groupRes.group_size - 1);
            setNumFriends(friendCount);
            const otherMembers = groupRes.members.filter(m => !m.is_leader);
            const rolls: string[] = [];
            for (let i = 0; i < friendCount; i++) {
              rolls.push(otherMembers[i]?.roll_number || '');
            }
            setFriendRollInputs(rolls);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize booking wizard.');
      } finally {
        setLoading(false);
      }
    };

    initWizard();
  }, [user, navigate]);

  // Polling for group members status updates when in Step 1 with friends
  useEffect(() => {
    if (!stayWithFriends || currentStep !== 1 || !user || invitedMemberInfo || wizardMode === 'review') return;

    const pollGroup = async () => {
      try {
        const res = await apiFetch<MyGroup>('/student/group/my-group');
        if (res.in_group && res.role === 'leader') {
          setMyGroup(res);
        }
      } catch (e) {
        // silently ignore polling errors
      }
    };

    const interval = setInterval(pollGroup, 2500);
    return () => clearInterval(interval);
  }, [stayWithFriends, currentStep, user, invitedMemberInfo, wizardMode]);

  // Fetch Rooms for Preference 1
  useEffect(() => {
    const p1 = preferences[0];
    if (p1 && p1.hostel_id) {
      apiFetch<{ rooms: Room[] }>(`/student/rooms/${p1.hostel_id}?sharing_type=${p1.sharing_type || ''}`)
        .then(res => setPref1Rooms(res.rooms))
        .catch(() => setPref1Rooms([]));
    } else {
      setPref1Rooms([]);
    }
  }, [preferences[0]?.hostel_id, preferences[0]?.sharing_type]);

  // Reset selected rooms if Preference 1 hostel or sharing changes (unless editing)
  useEffect(() => {
    if (wizardMode !== 'edit') {
      setSelectedRoomIds([]);
    }
  }, [preferences[0]?.hostel_id, preferences[0]?.sharing_type, wizardMode]);

  const isAllocated = existingApp?.status === 'allocated' || existingApp?.status === 'payment_completed';

  // Populate state and start Editing mode
  const handleStartEditing = () => {
    if (!existingApp) return;
    if (isAllocated) {
      setError('Your room has already been allotted by the administration. Allotted applications cannot be edited.');
      return;
    }
    setError(null);
    setSuccessMessage(null);

    // 1. Roommates mode
    const isGroup = existingApp.roommate_mode === 'group';
    setStayWithFriends(isGroup);

    // 2. Preferences
    if (existingApp.preferences && existingApp.preferences.length > 0) {
      const p1 = existingApp.preferences[0];
      const p2 = existingApp.preferences[1];
      const p3 = existingApp.preferences[2];

      setPreferences([
        { rank: 1, hostel_id: p1?.hostel_id || null, sharing_type: p1?.sharing_type || null },
        { rank: 2, hostel_id: p2?.hostel_id || null, sharing_type: p2?.sharing_type || null },
        { rank: 3, hostel_id: p3?.hostel_id || null, sharing_type: p3?.sharing_type || null },
      ]);

      if (p2?.floor) setPref2Floors([p2.floor]);
      if (p3?.floor) setPref3Floors([p3.floor]);
    }

    // 3. Preferred rooms
    if (existingApp.preferred_rooms && existingApp.preferred_rooms.length > 0) {
      setSelectedRoomIds(existingApp.preferred_rooms.map(r => r.room_id));
      setWantSpecificRooms(true);
    } else {
      setSelectedRoomIds([]);
      setWantSpecificRooms(false);
    }

    setTermsAgreed(true);
    setCurrentStep(1);
    setWizardMode('edit');
  };

  // Cancel / Delete Application
  const handleConfirmCancel = async () => {
    if (isAllocated) {
      setError('Your room has already been allotted by the administration. Allotted applications cannot be cancelled.');
      setShowCancelModal(false);
      return;
    }
    setError(null);
    setCancelling(true);
    try {
      await apiFetch('/student/application/cancel', { method: 'POST' });
      setExistingApp(null);
      setWizardMode('new');
      setCurrentStep(1);
      setStayWithFriends(null);
      setPreferences([
        { rank: 1, hostel_id: null, sharing_type: null },
        { rank: 2, hostel_id: null, sharing_type: null },
        { rank: 3, hostel_id: null, sharing_type: null },
      ]);
      setSelectedRoomIds([]);
      setSuccessMessage('Your application has been cancelled. You can now start and submit a new booking.');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel application.');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  // Handle manual group refresh
  const handleRefreshGroup = async () => {
    setRefreshingGroup(true);
    try {
      const res = await apiFetch<MyGroup>('/student/group/my-group');
      if (res.in_group && res.role === 'leader') {
        setMyGroup(res);
      }
    } catch (e) {
      // ignore
    } finally {
      setTimeout(() => setRefreshingGroup(false), 500);
    }
  };

  // Handle number of friends change
  const handleNumFriendsChange = (count: number) => {
    setNumFriends(count);
    const current = [...friendRollInputs];
    if (current.length < count) {
      while (current.length < count) current.push('');
    } else {
      current.length = count;
    }
    setFriendRollInputs(current);

    // Reset sharing selections in preferences if they are now smaller than group size
    const newGroupSize = count + 1;
    setPreferences(prev => prev.map(p => {
      if (p.sharing_type && p.sharing_type < newGroupSize) {
        return { ...p, sharing_type: null };
      }
      return p;
    }));
  };

  // Step 1: Send roommate invitation to a friend
  const handleInviteFriend = async (index: number) => {
    const roll = friendRollInputs[index]?.trim().toUpperCase();
    if (!roll) {
      setInviteErrors(prev => ({ ...prev, [index]: 'Please enter a valid roll number.' }));
      return;
    }
    setInviteErrors(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
    setSendingInviteIndex(index);

    try {
      await apiFetch<any>('/student/group/invite', {
        method: 'POST',
        body: JSON.stringify({
          roll_number: roll,
          target_group_size: numFriends + 1,
        }),
      });

      // Refresh group status
      const groupRes = await apiFetch<MyGroup>('/student/group/my-group');
      if (groupRes.in_group) {
        setMyGroup(groupRes);
      }
    } catch (err: any) {
      setInviteErrors(prev => ({ ...prev, [index]: err.message || 'Invitation failed.' }));
    } finally {
      setSendingInviteIndex(null);
    }
  };

  // Step 1: Remove or replace a friend
  const handleRemoveOrReplace = async (studentId: number, index: number, isReplace: boolean) => {
    try {
      const newSize = isReplace ? (numFriends + 1) : Math.max(2, numFriends);
      await apiFetch('/student/group/remove-member', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          new_group_size: newSize,
        }),
      });

      if (!isReplace) {
        handleNumFriendsChange(Math.max(1, numFriends - 1));
      } else {
        setFriendRollInputs(prev => {
          const copy = [...prev];
          copy[index] = '';
          return copy;
        });
      }

      const groupRes = await apiFetch<MyGroup>('/student/group/my-group');
      setMyGroup(groupRes.in_group ? groupRes : null);
    } catch (err: any) {
      setError(err.message || 'Failed to update roommate group.');
    }
  };

  // Step 1: Reset group when switching to individual booking
  const handleResetGroupToIndividual = async () => {
    setStayWithFriends(false);
    setPreferences(prev => prev.map(p => ({ ...p, sharing_type: null })));
    try {
      await apiFetch('/student/group/reset', { method: 'POST' });
      setMyGroup(null);
      setFriendRollInputs(['']);
      setInviteErrors({});
    } catch (e) {
      // ignore
    }
  };

  // Invited student: respond Yes or No to incoming invitation
  const handleRespondToInvite = async (action: 'accept' | 'reject') => {
    if (!invitedMemberInfo) return;
    try {
      await apiFetch(`/student/invitations/${invitedMemberInfo.invitation_id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });

      if (action === 'accept') {
        setInvitedMemberInfo(prev => prev ? { ...prev, membership_status: 'accepted' } : null);
      } else {
        setInvitedMemberInfo(null);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to respond to invitation.');
    }
  };

  // Leave group if accepted member wants to back out
  const handleLeaveGroup = async () => {
    if (!user) return;
    try {
      await apiFetch('/student/group/remove-member', {
        method: 'POST',
        body: JSON.stringify({ student_id: user.id }),
      });
      setInvitedMemberInfo(null);
    } catch (err: any) {
      setError(err.message || 'Failed to leave group.');
    }
  };

  const togglePrefFloor = (prefRank: 2 | 3, floor: number) => {
    if (prefRank === 2) {
      setPref2Floors(prev => {
        if (prev.includes(floor)) {
          if (prev.length === 1) return prev;
          return prev.filter(f => f !== floor);
        }
        return [...prev, floor].sort((a, b) => a - b);
      });
    } else {
      setPref3Floors(prev => {
        if (prev.includes(floor)) {
          if (prev.length === 1) return prev;
          return prev.filter(f => f !== floor);
        }
        return [...prev, floor].sort((a, b) => a - b);
      });
    }
  };

  // Validation logic per step
  const validateCurrentStep = (): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (stayWithFriends === null) {
        setError('Please select whether you want to stay with friends or book individually.');
        return false;
      }

      if (stayWithFriends) {
        if (!myGroup || !myGroup.members) {
          setError('Please invite your friends and verify their acceptance before proceeding.');
          return false;
        }

        const friendMembers = myGroup.members.filter(m => !m.is_leader);
        if (friendMembers.length < numFriends) {
          setError(`Please send invitations to all ${numFriends} friends.`);
          return false;
        }

        const pendingFriends = friendMembers.filter(m => m.status === 'pending');
        if (pendingFriends.length > 0) {
          setError('Waiting for all invited roommates to give Yes before you can move to Step 2.');
          return false;
        }

        const rejectedFriends = friendMembers.filter(m => m.status === 'rejected');
        if (rejectedFriends.length > 0) {
          setError('One or more friends gave No. Please replace them or proceed without them.');
          return false;
        }

        const allAccepted = friendMembers.every(m => m.status === 'accepted');
        if (!allAccepted) {
          setError('All roommates must accept (give Yes) before proceeding.');
          return false;
        }
      }
      return true;
    }

    if (currentStep === 2) {
      // First two preferences are mandatory
      if (!preferences[0].hostel_id || !preferences[0].sharing_type) {
        setError('Preference #1 is mandatory. Please select both a hostel and sharing capacity.');
        return false;
      }
      if (!preferences[1].hostel_id || !preferences[1].sharing_type) {
        setError('Preference #2 is mandatory. Please select both a hostel and sharing capacity.');
        return false;
      }

      // Third preference is optional; if partially filled, both must be specified
      if (preferences[2].hostel_id && !preferences[2].sharing_type) {
        setError('Preference #3: Please select sharing capacity or clear the hostel selection.');
        return false;
      }
      if (!preferences[2].hostel_id && preferences[2].sharing_type) {
        setError('Preference #3: Please select a hostel or clear the sharing capacity.');
        return false;
      }

      // Allow same hostel with different sharing, but ensure (hostel_id, sharing_type) combinations are unique
      const validPrefs = preferences.filter(p => p.hostel_id !== null && p.sharing_type !== null);
      const combos = validPrefs.map(p => `${p.hostel_id}-${p.sharing_type}`);
      if (combos.length !== new Set(combos).size) {
        setError('Each preference must be unique. You can select the same hostel with different sharing capacities.');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      if (pref2Floors.length === 0) {
        setError('Please select at least one floor for your second preference.');
        return false;
      }
      // Only validate pref3Floors if Preference 3 was selected
      if (preferences[2].hostel_id && preferences[2].sharing_type && pref3Floors.length === 0) {
        setError('Please select at least one floor for your third preference.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleToggleRoom = (roomId: number) => {
    if (selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds(prev => prev.filter(id => id !== roomId));
    } else {
      if (selectedRoomIds.length >= 5) return;
      setSelectedRoomIds(prev => [...prev, roomId]);
    }
  };

  // Submit new application OR Update existing application
  const handleSubmitOrUpdateApplication = async () => {
    if (!termsAgreed) {
      setError('Please read and agree to the Terms & Conditions before submitting.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const activePrefs = [];
      if (preferences[0].hostel_id && preferences[0].sharing_type) {
        activePrefs.push({
          hostel_id: preferences[0].hostel_id,
          sharing_type: preferences[0].sharing_type,
          floor: 1,
          flex_floor: true,
        });
      }
      if (preferences[1].hostel_id && preferences[1].sharing_type) {
        activePrefs.push({
          hostel_id: preferences[1].hostel_id,
          sharing_type: preferences[1].sharing_type,
          floor: pref2Floors.length > 0 ? Math.min(...pref2Floors) : 1,
          flex_floor: pref2Floors.length > 1,
        });
      }
      if (preferences[2].hostel_id && preferences[2].sharing_type) {
        activePrefs.push({
          hostel_id: preferences[2].hostel_id,
          sharing_type: preferences[2].sharing_type,
          floor: pref3Floors.length > 0 ? Math.min(...pref3Floors) : 1,
          flex_floor: pref3Floors.length > 1,
        });
      }

      const friendRolls = stayWithFriends && myGroup
        ? myGroup.members.filter(m => !m.is_leader && m.status === 'accepted').map(m => m.roll_number)
        : [];

      const body = {
        preferences: activePrefs,
        roommate_mode: stayWithFriends ? 'group' : 'none',
        friend_rolls: friendRolls,
        preferred_room_ids: wantSpecificRooms ? selectedRoomIds : [],
      };

      if (wizardMode === 'edit') {
        // Update existing application
        const res = await apiFetch<{ registration_number: string; application: Application }>('/student/application', {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setExistingApp(res.application);
        setWizardMode('review');
        setSuccessMessage('Application modified and updated successfully!');
      } else {
        // Submit brand new application
        const res = await apiFetch<{ registration_number: string }>('/student/application', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setSubmittedRegNum(res.registration_number);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#edf0f7] text-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-pink border-t-transparent" />
      </div>
    );
  }

  // CASE: Student has been invited by someone else
  if (invitedMemberInfo) {
    return (
      <div className="min-h-screen flex flex-col bg-[#edf0f7] text-slate-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 flex-grow w-full">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            {invitedMemberInfo.membership_status === 'pending' ? (
              <div className="space-y-6 animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-brand-pink/15 text-brand-pink flex items-center justify-center border border-brand-pink/30">
                  <UserPlus className="w-7 h-7" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-pink block mb-1">
                    Roommate Invitation Received
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Join {invitedMemberInfo.leader_name}'s Room Group?
                  </h2>
                  <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed">
                    Student <span className="font-semibold text-slate-900">{invitedMemberInfo.leader_name}</span> ({invitedMemberInfo.leader_roll}) has invited you to join their {invitedMemberInfo.group_size}-person room registration in {user?.gender} hostel accommodation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Group Initiator:</span>
                    <span className="font-semibold text-slate-900">{invitedMemberInfo.leader_name} ({invitedMemberInfo.leader_roll})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Target Group Size:</span>
                    <span className="font-semibold text-brand-pink">{invitedMemberInfo.group_size} Members</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Accommodation Category:</span>
                    <span className="font-semibold capitalize text-slate-900">{user?.gender} Hostel</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <span className="font-bold">Important: </span>
                  If you click <span className="text-emerald-700 font-bold">Yes</span>, your registration will be locked to this group and managed by {invitedMemberInfo.leader_name}. You will not need to submit a separate application.
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRespondToInvite('accept')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Yes, Accept Invitation
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRespondToInvite('reject')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    No, Decline
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mx-auto sm:mx-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    Registration Locked • Roommate Group Confirmed
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    You are part of {invitedMemberInfo.leader_name}'s Room Group
                  </h2>
                  <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed">
                    You have accepted the roommate invitation from <span className="font-semibold text-slate-900">{invitedMemberInfo.leader_name}</span> ({invitedMemberInfo.leader_roll}). Your group leader is currently completing the hostel preferences and will submit the joint booking on your behalf.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Group Leader:</span>
                    <span className="font-semibold text-slate-900">{invitedMemberInfo.leader_name} ({invitedMemberInfo.leader_roll})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Status:</span>
                    <span className="font-semibold text-emerald-700">Accepted & Confirmed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Separate Submission:</span>
                    <span className="font-mono text-slate-700 font-semibold">Disabled (Handled by Leader)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Link
                    to="/student-dashboard"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white font-bold text-xs shadow-lg shadow-brand-pink/25 transition-all text-center inline-block"
                  >
                    Go to Student Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 hover:border-rose-300 text-xs font-semibold transition-all shadow-sm"
                  >
                    Leave Group
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate friends status for group leader
  const friendMembers = myGroup?.members.filter(m => !m.is_leader) || [];
  const allFriendsAccepted = stayWithFriends
    ? (friendMembers.length === numFriends && friendMembers.every(m => m.status === 'accepted'))
    : true;
  const anyFriendPending = stayWithFriends && friendMembers.some(m => m.status === 'pending');
  const anyFriendRejected = stayWithFriends && friendMembers.some(m => m.status === 'rejected');

  return (
    <div className="min-h-screen flex flex-col bg-[#edf0f7] text-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        
        {/* Wizard Heading */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-pink mb-1 block">
              StayWise Campus Accommodation
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {wizardMode === 'review' ? 'Hostel Application Management' : 'Hostel Booking Application'}
            </h1>
          </div>

          {wizardMode === 'review' && existingApp && (
            isAllocated ? (
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Allocation Finalized (Locked)
                </span>
                <Link
                  to="/student-dashboard"
                  className="px-4 py-2 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white text-xs font-bold transition-all shadow-md shadow-brand-pink/20 flex items-center gap-1.5"
                >
                  View Bed Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="px-4 py-2 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white text-xs font-bold transition-all shadow-md shadow-brand-pink/20 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit / Modify Application
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancel Application
                </button>
              </div>
            )
          )}
        </div>

        {/* Edit mode top notice */}
        {wizardMode === 'edit' && existingApp && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modifying Application (Reg #{existingApp.registration_number}):</strong> Update preferences, roommates, or room choices below. Changes are saved when you submit in Step 4.
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setWizardMode('review'); setError(null); }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm self-start sm:self-auto shrink-0"
            >
              Exit Edit Mode
            </button>
          </div>
        )}

        {/* Progress Bar (hidden in review mode) */}
        {!submittedRegNum && wizardMode !== 'review' && <ProgressBar currentStep={currentStep} />}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS SCREEN */}
        {submittedRegNum ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Application Submitted!</h2>
            <p className="text-xs text-slate-700 font-medium max-w-md mx-auto mb-6">
              Your hostel room booking request is recorded and locked. Allocations run automatically after the deadline. You can review, modify, or cancel this booking until the deadline.
            </p>

            <div className="inline-block p-5 rounded-2xl bg-slate-50 border border-brand-pink/30 mb-8 max-w-sm w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Registration Number
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-brand-pink tracking-wider">
                {submittedRegNum}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student-dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-pink hover:bg-brand-hoverPink text-white font-bold text-xs shadow-xl shadow-brand-pink/20 transition-all inline-block"
              >
                Go to Student Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedRegNum(null);
                  setWizardMode('review');
                  // reload application
                  apiFetch<any>('/student/application').then(res => {
                    if (res.has_application) setExistingApp(res.application);
                  });
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 shadow-sm transition-all"
              >
                Review or Edit Application
              </button>
            </div>
          </div>
        ) : wizardMode === 'review' && existingApp ? (
          /* REVIEW & MANAGEMENT VIEW FOR EXISTING SUBMISSION */
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                {isAllocated ? (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Room Allotted • Changes Locked
                  </span>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Active Submission Recorded
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Application Review</h2>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  Registration Number: <span className="font-mono text-[#bf0c4e] font-bold">{existingApp.registration_number}</span>
                </p>
              </div>

              <div className="text-xs text-slate-700 sm:text-right">
                <span className="block text-[11px] text-slate-700 font-semibold">Cycle Year</span>
                <span className="font-bold text-slate-900">2026 Academic Season</span>
              </div>
            </div>

            {/* Current Preferences Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-2 h-4 bg-[#bf0c4e] rounded-full inline-block" />
                Your Submitted Choices
              </h3>

              <div className="grid grid-cols-1 gap-3.5">
                {existingApp.preferences.map((p, idx) => {
                  if (!p) return null;
                  const h = eligibleHostels.find(x => x.id === p.hostel_id);
                  const isPref1 = idx === 0;

                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-[#bf0c4e] bg-[#fdf2f6] border border-pink-200 px-3 py-1 rounded-full">
                            Preference #{idx + 1}
                          </span>
                          <h4 className="font-bold text-slate-900 text-base">{h?.name || `Hostel ID ${p.hostel_id}`}</h4>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">
                          Sharing Type: <span className="text-slate-900 font-bold">{p.sharing_type}-Sharing Room</span>
                          {p.floor && (
                            <span className="ml-2.5 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px]">
                              Floor {p.floor}
                            </span>
                          )}
                        </p>
                      </div>

                      {isPref1 && existingApp.preferred_rooms && existingApp.preferred_rooms.length > 0 && (
                        <div className="text-xs sm:text-right">
                          <span className="text-xs text-slate-900 font-bold block mb-1.5 sm:text-right">Specific Rooms:</span>
                          <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
                            {existingApp.preferred_rooms.map(pr => (
                              <span key={pr.id} className="font-mono font-bold text-xs bg-[#fdf2f6] text-[#bf0c4e] border border-pink-200 px-2.5 py-1 rounded-lg shadow-sm">
                                {pr.room_number || `Room #${pr.room_id}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Roommate details if group */}
            {existingApp.roommate_mode === 'group' && (
              <div className="p-5 rounded-2xl bg-[#fdf2f6] border-2 border-pink-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#bf0c4e]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Roommate Group Booking</span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  Allocated together into the same room under <strong className="text-[#bf0c4e] font-mono">Group #{existingApp.group_id}</strong>.
                </p>
              </div>
            )}

            {/* Deadline & Edit Notice or Locked Alert */}
            {isAllocated ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 shadow-sm flex items-start gap-3.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-800 space-y-1">
                  <span className="font-bold text-emerald-900 text-sm block">Hostel Room Officially Allotted:</span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    Your hostel room has been officially allotted by the administrator. As per university allocation regulations, your application is locked and can no longer be edited, modified, or cancelled.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#fdf2f6] text-[#bf0c4e] flex items-center justify-center shrink-0 border border-pink-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-900 text-sm block">Flexible Modification Window</span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    You can edit your preferences, add/remove friends, or cancel and submit a new booking at any time before the allocation run deadline.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-200">
              {isAllocated ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Application Locked against Edits or Cancellations
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs shadow-md shadow-[#bf0c4e]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit / Modify Application
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 hover:border-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel Application
                  </button>
                </div>
              )}

              <Link
                to="/student-dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border-2 border-slate-300 hover:border-slate-400 transition-all text-center inline-block shadow-sm cursor-pointer"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* WIZARD FLOW (NEW OR EDITING MODE) */
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            
            {/* STEP 1: Roommates / Friends Verification */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-brand-border pb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-pink" />
                    Step 1: Roommate Preference & Verification
                  </h3>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    Choose whether you want to stay with friends or apply for an individual room.
                  </p>
                </div>

                {/* Question */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-900">
                    Would you like to stay with your friends?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setStayWithFriends(true)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        stayWithFriends === true
                          ? 'bg-[#fdf2f6] border-[#bf0c4e] ring-2 ring-[#bf0c4e]/30'
                          : 'bg-white border-slate-300 hover:border-[#bf0c4e]/40 shadow-sm'
                      }`}
                    >
                      <h4 className="font-bold text-slate-900 text-sm mb-1">Yes, I want to stay with friends</h4>
                      <p className="text-xs text-slate-700 font-medium">Form a group of 2, 3, or 4 students and get allocated together in one room.</p>
                    </div>

                    <div
                      onClick={handleResetGroupToIndividual}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        stayWithFriends === false
                          ? 'bg-[#fdf2f6] border-[#bf0c4e] ring-2 ring-[#bf0c4e]/30'
                          : 'bg-white border-slate-300 hover:border-[#bf0c4e]/40 shadow-sm'
                      }`}
                    >
                      <h4 className="font-bold text-slate-900 text-sm mb-1">No, I prefer an individual booking</h4>
                      <p className="text-xs text-slate-700 font-medium">Individual booking. You can select single, double, triple, or 4-sharing rooms.</p>
                    </div>
                  </div>
                </div>

                {/* If Yes: Friend Invitations & Verification */}
                {stayWithFriends === true && (
                  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-5 animate-in fade-in shadow-sm">
                    
                    {/* Header with Refresh button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Group Size: Select Number of Friends
                        </label>
                        <span className="text-[11px] text-slate-700 font-medium">
                          Only {user?.gender} students can be grouped in {user?.gender} hostel accommodation.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRefreshGroup}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Check if friends responded Yes/No"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshingGroup ? 'animate-spin text-brand-pink' : ''}`} />
                        Refresh Status
                      </button>
                    </div>

                    {/* Friend count selector */}
                    <div className="flex items-center gap-3">
                      {[1, 2, 3].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleNumFriendsChange(cnt)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                            numFriends === cnt
                              ? 'bg-brand-pink text-white shadow-md shadow-brand-pink/20'
                              : 'bg-white text-slate-800 border border-slate-300 hover:border-brand-pink/40 shadow-sm'
                          }`}
                        >
                          {cnt} Friend{cnt > 1 ? 's' : ''} ({cnt + 1} Total)
                        </button>
                      ))}
                    </div>

                    {/* Group Status Checklist Banner */}
                    {allFriendsAccepted ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>All {numFriends} roommates accepted (Yes)! You can now proceed to Step 2 to select hostel preferences.</span>
                      </div>
                    ) : anyFriendRejected ? (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>One or more roommates gave No. Please replace them or click 'Proceed without this friend' below.</span>
                      </div>
                    ) : anyFriendPending ? (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                        <Clock className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
                        <span>Waiting for all invited roommates to give Yes before you can move to Step 2. Page auto-updates every few seconds.</span>
                      </div>
                    ) : null}

                    {/* Slots List */}
                    <div className="space-y-4">
                      {/* Leader Card (Slot 0) */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-pink/15 text-brand-pink font-mono font-bold text-xs flex items-center justify-center border border-brand-pink/30">
                            L
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{user?.name} (You)</span>
                            <span className="text-[11px] font-mono text-slate-700 font-semibold">{user?.roll_number} • Group Leader</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Confirmed
                        </span>
                      </div>

                      {/* Gender Policy Guidance */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                        <span className="font-semibold">
                          Hostel Category: <strong className="text-[#bf0c4e] uppercase font-bold">{user?.gender} Accommodation</strong>
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          (Roommates must be {user?.gender === 'female' ? 'Female students' : 'Male students'} for joint room bookings)
                        </span>
                      </div>

                      {/* Friend Slots */}
                      {Array.from({ length: numFriends }).map((_, idx) => {
                        const existingMember = friendMembers[idx];
                        const inputVal = friendRollInputs[idx] || '';
                        const slotError = inviteErrors[idx];

                        return (
                          <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                Roommate #{idx + 1} Slot
                              </span>

                              {existingMember && (
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                  existingMember.status === 'accepted'
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : existingMember.status === 'rejected'
                                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                                }`}>
                                  {existingMember.status === 'accepted' && <Check className="w-3 h-3 text-emerald-600" />}
                                  {existingMember.status === 'rejected' && <X className="w-3 h-3 text-rose-600" />}
                                  {existingMember.status === 'pending' && <Clock className="w-3 h-3 text-amber-600 animate-pulse" />}
                                  {existingMember.status === 'accepted' ? 'Accepted (Yes)' : existingMember.status === 'rejected' ? 'Declined (No)' : 'Waiting for Yes/No (Pending)'}
                                </span>
                              )}
                            </div>

                            {existingMember ? (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                <div>
                                  <h5 className="text-xs font-bold text-slate-900">{existingMember.name}</h5>
                                  <p className="text-[11px] font-mono text-slate-700 font-semibold">
                                    Roll #{existingMember.roll_number} • {existingMember.gender}
                                  </p>
                                </div>

                                {/* Actions if Rejected */}
                                {existingMember.status === 'rejected' && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOrReplace(existingMember.student_id, idx, true)}
                                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-[#bf0c4e] text-[#bf0c4e] hover:text-white border border-[#bf0c4e]/30 text-[11px] font-bold transition-all shadow-sm"
                                    >
                                      Replace Friend
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOrReplace(existingMember.student_id, idx, false)}
                                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-300 shadow-sm transition-all"
                                    >
                                      Proceed without this friend
                                    </button>
                                  </div>
                                )}

                                {/* Action if Pending: allow cancel */}
                                {existingMember.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOrReplace(existingMember.student_id, idx, true)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-300 text-[11px] font-bold transition-all"
                                  >
                                    Cancel & Replace
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={inputVal}
                                    onChange={(e) => {
                                      const newInputs = [...friendRollInputs];
                                      newInputs[idx] = e.target.value.toUpperCase();
                                      setFriendRollInputs(newInputs);
                                    }}
                                    placeholder={`Friend #${idx + 1} Roll No (e.g. ${user?.gender === 'female' ? 'CB.SC.U4CSE24002' : 'CB.SC.U4CSE24004'})`}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] font-mono shadow-sm"
                                  />

                                  <button
                                    type="button"
                                    disabled={sendingInviteIndex === idx}
                                    onClick={() => handleInviteFriend(idx)}
                                    className="px-4 py-2 rounded-xl bg-brand-pink hover:bg-brand-hoverPink disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-brand-pink/20"
                                  >
                                    {sendingInviteIndex === idx ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Search className="w-3.5 h-3.5" />
                                    )}
                                    Verify & Invite
                                  </button>
                                </div>

                                {slotError && (
                                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 shadow-xs">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                                    <span className="leading-relaxed">{slotError}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: 3 Hostel Preferences (Same hostel different sharing allowed) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-brand-pink" />
                    Step 2: Hostel Preferences
                  </h3>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    Preferences #1 and #2 are <strong className="text-[#bf0c4e]">mandatory</strong>. Preference #3 is <strong className="text-slate-600">optional</strong>. Same hostel with different sharing is allowed.
                  </p>
                </div>

                <div className="space-y-4">
                  {preferences.map((pref, idx) => {
                    const selectedHostel = eligibleHostels.find(h => h.id === pref.hostel_id);
                    const isOptional = pref.rank === 3;
                    const eligibleSharings = selectedHostel?.sharing_configs.filter(c => {
                      if (!c.is_available) return false;
                      if (c.sharing_type < totalGroupSize) return false;
                      if (c.sharing_type === 1 && (user?.academic_year || 1) < 3 && !user?.is_pg_scholar) return false;
                      return true;
                    }) || [];

                    return (
                      <div key={pref.rank} className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                              isOptional
                                ? 'text-slate-600 bg-slate-100 border border-slate-200'
                                : 'text-[#bf0c4e] bg-[#fdf2f6] border border-pink-200'
                            }`}>
                              Preference #{pref.rank} {isOptional ? '(Optional)' : '(Mandatory)'}
                            </span>
                            {pref.rank === 1 && (
                              <span className="text-[11px] font-bold text-[#800834] bg-[#fdf2f6] border border-pink-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <Sparkles className="w-3 h-3 text-[#bf0c4e]" />
                                Specific Room Selection in Step 3
                              </span>
                            )}
                            {isOptional && (pref.hostel_id || pref.sharing_type) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreferences(prev => prev.map((p, i) => i === 2 ? { ...p, hostel_id: null, sharing_type: null } : p));
                                }}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline ml-2 cursor-pointer"
                              >
                                Clear / Skip
                              </button>
                            )}
                          </div>
                          {selectedHostel && (
                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              {selectedHostel.name} {selectedHostel.code ? `(${selectedHostel.code})` : ''}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                              Hostel Name {isOptional ? '(Optional)' : '*'}
                            </label>
                            <select
                              value={pref.hostel_id || ''}
                              onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : null;
                                setPreferences(prev => prev.map((p, i) => i === idx ? { ...p, hostel_id: val, sharing_type: null } : p));
                              }}
                              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:border-[#bf0c4e] focus:ring-1 focus:ring-[#bf0c4e] focus:outline-none shadow-sm cursor-pointer"
                            >
                              <option value="" className="text-slate-500 font-normal bg-white">
                                {isOptional ? '-- None / Skip Preference 3 (Optional) --' : '-- Select Hostel --'}
                              </option>
                              {eligibleHostels.map(h => (
                                <option key={h.id} value={h.id} className="text-slate-900 font-semibold bg-white py-1">
                                  {h.name} {h.code ? `(${h.code})` : ''} {h.code === 'KAP' ? '— PG Scholars Only' : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                              Sharing Capacity {isOptional ? '(Optional)' : '*'}
                            </label>
                            <select
                              value={pref.sharing_type || ''}
                              disabled={!selectedHostel}
                              onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : null;
                                setPreferences(prev => prev.map((p, i) => i === idx ? { ...p, sharing_type: val } : p));
                              }}
                              className={`w-full rounded-xl px-3 py-2.5 text-xs font-bold shadow-sm transition-all ${
                                !selectedHostel
                                  ? 'bg-slate-100 border-2 border-slate-200 text-slate-500 cursor-not-allowed'
                                  : 'bg-white border-2 border-slate-300 text-slate-900 focus:border-[#bf0c4e] focus:ring-1 focus:ring-[#bf0c4e] focus:outline-none cursor-pointer'
                              }`}
                            >
                              <option value="" className="text-slate-500 font-normal bg-white">
                                {selectedHostel ? '-- Choose Sharing Type --' : '-- First Select a Hostel --'}
                              </option>
                              {eligibleSharings.map(cfg => (
                                <option key={cfg.id} value={cfg.sharing_type} className="text-slate-900 font-semibold bg-white py-1">
                                  {cfg.sharing_type}-Sharing (₹{cfg.fee_amount.toLocaleString()} / term)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Room Choices (matching reference design) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 mb-1">Room choices</h2>
                  <p className="text-xs text-slate-700 font-medium">
                    Hostels without your chosen room type are skipped automatically.
                  </p>
                </div>

                {/* Preference 1 Card */}
                {(() => {
                  const hostel1 = eligibleHostels.find(h => h.id === preferences[0]?.hostel_id);
                  const hostel1Initial = hostel1 ? hostel1.name.charAt(0).toUpperCase() : 'S';
                  const sharingLabels: { [key: number]: string } = {
                    1: 'Single-sharing',
                    2: 'Two-sharing',
                    3: 'Three-sharing',
                    4: 'Four-sharing',
                  };
                  const p1Sharing = preferences[0]?.sharing_type;
                  const sharingLabel = p1Sharing ? (sharingLabels[p1Sharing] || `${p1Sharing}-sharing`) : 'Three-sharing';

                  return (
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                          <span className="w-2.5 h-6 bg-[#bf0c4e] rounded-full inline-block" />
                          <span>{hostel1?.name || 'First Preference'}: 1st Preference Choices</span>
                        </h3>
                        <span className="text-xs font-bold text-[#bf0c4e] bg-[#fdf2f6] border border-pink-200 px-3 py-1 rounded-full">
                          Preference #1
                        </span>
                      </div>

                      {/* Specific Rooms Checkbox Card */}
                      <div className="p-4 rounded-2xl bg-[#fdf2f6] border border-pink-200 flex items-center justify-between">
                        <label className="flex items-center gap-3 text-sm font-bold text-slate-900 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={wantSpecificRooms}
                            onChange={(e) => setWantSpecificRooms(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#bf0c4e] cursor-pointer"
                          />
                          <span>I want specific rooms (pick up to 5)</span>
                        </label>

                        {wantSpecificRooms && (
                          <span className="text-xs font-mono font-bold text-white bg-[#bf0c4e] px-3.5 py-1 rounded-full shadow-sm">
                            Selected {selectedRoomIds.length}/5
                          </span>
                        )}
                      </div>

                      {wantSpecificRooms ? (
                        <div className="space-y-4 pt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                              <span className="w-2 h-4 bg-[#bf0c4e] rounded-full inline-block" />
                              <span className="uppercase tracking-wide">{sharingLabel}</span>
                            </div>

                            {/* Search Filter for 100 Rooms / Floor */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Search room (e.g. G-105, F-220)"
                                value={roomSearchTerm}
                                onChange={(e) => setRoomSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] focus:ring-1 focus:ring-[#bf0c4e] w-60 shadow-sm font-medium"
                              />
                            </div>
                          </div>

                          {/* Floor-by-floor Room Matrix (100 rooms per floor) */}
                          <div className="space-y-3.5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                            {[
                              { floorNum: 1, label: 'Ground Floor', range: 'G-101 – G-200' },
                              { floorNum: 2, label: '1st Floor', range: 'F-200 – F-299' },
                              { floorNum: 3, label: '2nd Floor', range: 'S-300 – S-399' },
                              { floorNum: 4, label: '3rd Floor', range: 'T-400 – T-499' },
                            ].map(({ floorNum, label, range }) => {
                              const floorRooms = pref1Rooms
                                .filter(r => r.floor === floorNum)
                                .filter(r => !roomSearchTerm.trim() || r.room_number.toLowerCase().includes(roomSearchTerm.toLowerCase().trim()));

                              return (
                                <div key={floorNum} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                  <div className="w-36 shrink-0 flex flex-col">
                                    <span className="text-xs text-slate-900 font-bold">{label}</span>
                                    <span className="text-[10px] text-slate-700 font-mono font-semibold">{range}</span>
                                  </div>

                                  <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent flex-grow">
                                    {floorRooms.length > 0 ? (
                                      floorRooms.map(room => {
                                        const isSelected = selectedRoomIds.includes(room.id);
                                        const isFull = room.available_beds <= 0;
                                        const displayCode = room.room_number;

                                        return (
                                          <button
                                            key={room.id}
                                            type="button"
                                            onClick={() => !isFull && handleToggleRoom(room.id)}
                                            disabled={isFull}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                                              isSelected
                                                ? 'bg-[#bf0c4e] text-white shadow-md shadow-[#bf0c4e]/30 border-2 border-[#bf0c4e] scale-105'
                                                : isFull
                                                ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed opacity-70 line-through'
                                                : 'bg-white text-slate-900 border-2 border-slate-300 hover:border-[#bf0c4e] hover:text-[#bf0c4e] hover:bg-[#fdf2f6] shadow-sm'
                                            }`}
                                            title={isFull ? 'Room is full' : `Room ${room.room_number} (${room.available_beds} beds free)`}
                                          >
                                            {displayCode}
                                          </button>
                                        );
                                      })
                                    ) : (
                                      <span className="text-xs text-slate-600 font-medium italic">No matching rooms on {label}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-[#fdf2f6] border border-pink-200 text-xs text-slate-800 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#bf0c4e] shrink-0" />
                          <span>Automatic allocation will select the best available room in {hostel1?.name}.</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Preference 2 Card */}
                {(() => {
                  const hostel2 = eligibleHostels.find(h => h.id === preferences[1]?.hostel_id);
                  return (
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                          <span className="w-2.5 h-6 bg-[#bf0c4e] rounded-full inline-block" />
                          <span>{hostel2?.name || 'Second Preference'}: Floor Choices</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#bf0c4e] bg-[#fdf2f6] border border-pink-200 px-3 py-1 rounded-full">
                            Preference #2
                          </span>
                          <span className="text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Pick any combination</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {[
                          { fl: 1, label: 'Ground Floor (G)' },
                          { fl: 2, label: 'First Floor (F)' },
                          { fl: 3, label: 'Second Floor (S)' },
                          { fl: 4, label: 'Third Floor (T)' },
                        ].map(({ fl, label }) => {
                          const isChecked = pref2Floors.includes(fl);
                          return (
                            <button
                              key={fl}
                              type="button"
                              onClick={() => togglePrefFloor(2, fl)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2 cursor-pointer ${
                                isChecked
                                  ? 'bg-[#fdf2f6] border-[#bf0c4e] text-[#bf0c4e] shadow-sm'
                                  : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                isChecked ? 'bg-[#bf0c4e] border-[#bf0c4e]' : 'border-slate-400 bg-white'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                              </div>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Preference 3 Card (Optional) */}
                {preferences[2]?.hostel_id && preferences[2]?.sharing_type ? (
                  (() => {
                    const hostel3 = eligibleHostels.find(h => h.id === preferences[2]?.hostel_id);
                    return (
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                            <span className="w-2.5 h-6 bg-[#bf0c4e] rounded-full inline-block" />
                            <span>{hostel3?.name || 'Third Preference'}: Floor Choices</span>
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                              Preference #3 (Optional)
                            </span>
                            <span className="text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Pick any combination</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {[
                            { fl: 1, label: 'Ground Floor (G)' },
                            { fl: 2, label: 'First Floor (F)' },
                            { fl: 3, label: 'Second Floor (S)' },
                            { fl: 4, label: 'Third Floor (T)' },
                          ].map(({ fl, label }) => {
                            const isChecked = pref3Floors.includes(fl);
                            return (
                              <button
                                key={fl}
                                type="button"
                                onClick={() => togglePrefFloor(3, fl)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2 cursor-pointer ${
                                  isChecked
                                    ? 'bg-[#fdf2f6] border-[#bf0c4e] text-[#bf0c4e] shadow-sm'
                                    : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
                                }`}
                              >
                                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                  isChecked ? 'bg-[#bf0c4e] border-[#bf0c4e]' : 'border-slate-400 bg-white'
                                }`}>
                                  {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                </div>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>Preference #3 was skipped (optional). Floor choices applied for Preferences #1 and #2.</span>
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">2 Preferences Configured</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Review, Terms & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                      <span className="w-2.5 h-6 bg-[#bf0c4e] rounded-full inline-block" />
                      <span>Step 4: Review Application & Terms Agreement</span>
                    </h3>
                    <span className="text-xs font-bold text-[#bf0c4e] bg-[#fdf2f6] border border-pink-200 px-3 py-1 rounded-full">
                      Final Step
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-2">
                    Review your application summary and agree to institutional terms before submission.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Applicant</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {user?.name} <span className="font-mono text-[#bf0c4e] font-bold">({user?.roll_number})</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Booking Mode</span>
                    <span className="font-bold text-[#bf0c4e] text-xs bg-[#fdf2f6] border border-pink-200 px-3 py-1 rounded-full">
                      {stayWithFriends ? `Group Booking (${totalGroupSize} Members)` : 'Individual Booking (Single)'}
                    </span>
                  </div>

                  {stayWithFriends && myGroup && (
                    <div className="border-b border-slate-200 pb-3">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block mb-2">Confirmed Roommates:</span>
                      <div className="flex flex-wrap gap-2">
                        {myGroup.members.filter(m => !m.is_leader).map(m => (
                          <span key={m.student_id} className="bg-[#fdf2f6] px-3 py-1.5 rounded-xl border border-pink-200 text-slate-900 font-mono text-xs font-bold shadow-sm inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#bf0c4e]" />
                            {m.name} <span className="text-[#bf0c4e] font-bold">({m.roll_number})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5 border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block mb-1">Ranked Hostel Preferences:</span>
                    {preferences.map((p, idx) => {
                      const h = eligibleHostels.find(x => x.id === p.hostel_id);
                      const isOptional = p.rank === 3;
                      const isSkipped = isOptional && (!p.hostel_id || !p.sharing_type);

                      if (isSkipped) {
                        return (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-400 text-white text-[10px] font-bold flex items-center justify-center">
                                3
                              </span>
                              <span className="font-semibold text-slate-500 text-xs italic">
                                Preference #3: Skipped (Optional)
                              </span>
                            </div>
                            <span className="font-mono text-slate-500 font-medium text-xs bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
                              None
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#bf0c4e] text-white text-[10px] font-bold flex items-center justify-center">
                              {p.rank}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {h?.name || 'Not selected'} {h?.code ? `(${h.code})` : ''}
                            </span>
                          </div>
                          <span className="font-mono text-[#bf0c4e] font-bold text-xs bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-sm">
                            {p.sharing_type ? `${p.sharing_type}-Sharing` : 'Any Sharing'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {wantSpecificRooms && selectedRoomIds.length > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-900">Preference 1 Preferred Rooms</span>
                      <span className="font-mono font-bold text-[#bf0c4e] text-xs bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-sm">
                        {selectedRoomIds.length} room{selectedRoomIds.length > 1 ? 's' : ''} specified
                      </span>
                    </div>
                  )}
                </div>

                {/* Terms and Conditions Section */}
                <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="termsAgreement"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#bf0c4e] cursor-pointer"
                    />
                    <label htmlFor="termsAgreement" className="text-xs text-slate-900 font-semibold cursor-pointer select-none leading-relaxed">
                      I have read, understood, and agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-[#bf0c4e] hover:text-[#9f0a41] underline font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        StayWise Hostel Accommodation Terms & Conditions
                      </button>
                      . I understand that room allocations are binding and non-transferable.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || submitting}
                className="px-5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-800 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentStep === 1 && stayWithFriends === true && !allFriendsAccepted}
                  className="px-5 py-2.5 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-[#bf0c4e]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={handleSubmitOrUpdateApplication}
                    disabled={submitting || !termsAgreed}
                    className="px-6 py-2.5 rounded-xl bg-[#bf0c4e] hover:bg-[#9f0a41] text-white font-bold text-xs shadow-lg shadow-[#bf0c4e]/25 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting
                      ? (wizardMode === 'edit' ? 'Updating Application...' : 'Submitting Application...')
                      : (wizardMode === 'edit' ? 'Save & Update Application' : 'Confirm & Submit Application')}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  {!termsAgreed && (
                    <span className="text-xs text-[#bf0c4e] font-semibold">Please accept Terms & Conditions to enable submission</span>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
      
      {/* Cancellation Confirmation Modal */}
      {showCancelModal && existingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Cancel Application?</h3>
              <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                Are you sure you want to cancel application <span className="font-mono text-slate-900 font-bold">{existingApp.registration_number}</span>? Once cancelled, this application will be removed and you can immediately configure and submit a fresh application.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Application'}
              </button>

              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 shadow-sm transition-all"
              >
                Keep Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setTermsAgreed(true)}
        showAcceptButton={true}
      />
    </div>
  );
};
