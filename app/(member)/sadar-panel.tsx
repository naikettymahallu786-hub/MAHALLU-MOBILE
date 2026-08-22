import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/api';

// Theme colors
const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const GOLD = '#C9972E';
const CREAM = '#FBF8F2';

export default function SadarPanelScreen() {
  const router = useRouter();

  // Active Main Tab: 'classes' | 'enroll'
  const [activeMainTab, setActiveMainTab] = useState<'classes' | 'enroll'>('classes');

  // Loading states
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Main Data
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // -------------------------------------------------------------
  // CLASS MANAGEMENT MODALS & STATES
  // -------------------------------------------------------------
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [fetchingClassStudents, setFetchingClassStudents] = useState(false);

  // Create Class Modal
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('1');
  const [newClassYear, setNewClassYear] = useState('2026-2027');
  const [newClassTeacherId, setNewClassTeacherId] = useState('');
  const [newClassSubjects, setNewClassSubjects] = useState('Quran, Fiqh, Arabic, Thareekh');

  // Unified Usthadh Picker Modal (for creating class or changing usthadh)
  const [showUsthadhPickerModal, setShowUsthadhPickerModal] = useState(false);
  const [usthadhPickerMode, setUsthadhPickerMode] = useState<'create_class' | 'change_class_usthadh'>('create_class');
  const [usthadhSearchQuery, setUsthadhSearchQuery] = useState('');
  const [usthadhSubTab, setUsthadhSubTab] = useState<'search' | 'new'>('search');

  // On-the-fly New Usthadh Form
  const [newUsthadhName, setNewUsthadhName] = useState('');
  const [newUsthadhEmail, setNewUsthadhEmail] = useState('');
  const [newUsthadhPassword, setNewUsthadhPassword] = useState('');
  const [newUsthadhPhone, setNewUsthadhPhone] = useState('');
  const [newUsthadhQualification, setNewUsthadhQualification] = useState('Islamic Scholar / Usthadh');

  // Add Students to Selected Class Modal
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [addStudentsTab, setAddStudentsTab] = useState<'family' | 'existing'>('family');
  const [familySearchQuery, setFamilySearchQuery] = useState('');
  const [selectedFamilyForClass, setSelectedFamilyForClass] = useState<any | null>(null);
  const [selectedFamilyMemberIds, setSelectedFamilyMemberIds] = useState<string[]>([]);
  const [selectedExistingStudentIds, setSelectedExistingStudentIds] = useState<string[]>([]);

  // -------------------------------------------------------------
  // QUICK ENROLLMENT TAB STATES
  // -------------------------------------------------------------
  const [enrollFamilyId, setEnrollFamilyId] = useState('');
  const [enrollMemberId, setEnrollMemberId] = useState('');
  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollAdmissionNo, setEnrollAdmissionNo] = useState('');
  const [enrollFamilyMembers, setEnrollFamilyMembers] = useState<any[]>([]);
  const [fetchingEnrollMembers, setFetchingEnrollMembers] = useState(false);
  const [showEnrollFamilyModal, setShowEnrollFamilyModal] = useState(false);
  const [showEnrollClassModal, setShowEnrollClassModal] = useState(false);

  // Load All Madrasa Data
  const loadData = async () => {
    try {
      setRefreshing(true);
      const [classesRes, teachersRes, membersRes, familiesRes, studentsRes] = await Promise.all([
        apiClient.get('/classes'),
        apiClient.get('/teachers', { params: { limit: 1000 } }),
        apiClient.get('/members', { params: { limit: 2000 } }),
        apiClient.get('/families', { params: { limit: 1000 } }),
        apiClient.get('/students', { params: { limit: 1000 } }),
      ]);

      setClasses(classesRes.data?.data || []);
      setTeachers(teachersRes.data?.data || teachersRes.data || []);
      const membersData = membersRes.data?.data;
      setMembers(Array.isArray(membersData) ? membersData : membersData?.items || []);
      setFamilies(familiesRes.data?.data?.families || familiesRes.data?.data || []);
      setAllStudents(studentsRes.data?.data || []);
    } catch (err) {
      console.warn('[Sadar Panel] Error loading data:', err);
    } finally {
      setFetchingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch students for a specific class when opened
  const handleOpenClassDetails = async (cls: any) => {
    setSelectedClass(cls);
    try {
      setFetchingClassStudents(true);
      const res = await apiClient.get(`/students?classId=${cls._id}&limit=200`);
      setClassStudents(res.data?.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load class students');
    } finally {
      setFetchingClassStudents(false);
    }
  };

  // 1. Create Class
  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      Alert.alert('Missing Class Name', 'Please enter a name for the class.');
      return;
    }

    try {
      setActionLoading(true);
      const payload: any = {
        name: newClassName.trim(),
        level: parseInt(newClassLevel, 10) || 1,
        academicYear: newClassYear.trim() || '2026-2027',
        subjects: newClassSubjects
          ? newClassSubjects.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (newClassTeacherId) {
        payload.teacherId = newClassTeacherId;
      }

      await apiClient.post('/classes', payload);
      Alert.alert('Success 🎉', 'Madrasa class created successfully! (ക്ലാസ് വിജയകരമായി ചേർത്തു)');
      setShowCreateClassModal(false);
      setNewClassName('');
      setNewClassTeacherId('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create class');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Select Usthadh from List (Teacher or Member)
  const handleSelectUsthadh = async (item: { teacherId?: string; memberId?: string; name: string; phone?: string }) => {
    try {
      setActionLoading(true);
      let teacherId = item.teacherId;

      // If user selected a Mahallu Member who is not registered as a teacher yet, create teacher record
      if (!teacherId && item.memberId) {
        const createTeacherRes = await apiClient.post('/teachers', {
          memberId: item.memberId,
          qualification: 'Usthadh / Teacher',
          salary: 0,
        });
        teacherId = createTeacherRes.data?.data?._id;
        await loadData();
      }

      if (!teacherId) {
        Alert.alert('Error', 'Could not select teacher');
        return;
      }

      if (usthadhPickerMode === 'create_class') {
        setNewClassTeacherId(teacherId);
        setShowUsthadhPickerModal(false);
      } else if (usthadhPickerMode === 'change_class_usthadh' && selectedClass) {
        await apiClient.put(`/classes/${selectedClass._id}`, { teacherId });
        Alert.alert('Success 🎉', 'Class Usthadh updated successfully!');
        setShowUsthadhPickerModal(false);
        await loadData();
        const updatedTeacher = teachers.find((t) => t._id === teacherId);
        setSelectedClass((prev: any) => ({ ...prev, teacherId: updatedTeacher || { name: item.name } }));
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to set Usthadh');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Create New Usthadh On-The-Fly with Login ID & Password
  const handleCreateNewUsthadh = async () => {
    if (!newUsthadhName.trim()) {
      Alert.alert('Missing Name', 'Please enter Usthadh name.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await apiClient.post('/teachers', {
        name: newUsthadhName.trim(),
        email: newUsthadhEmail.trim() || undefined,
        password: newUsthadhPassword.trim() || undefined,
        phone: newUsthadhPhone.trim() || undefined,
        qualification: newUsthadhQualification.trim() || 'Islamic Scholar / Usthadh',
        salary: 0,
      });

      const newTeacher = res.data?.data;
      const newTeacherId = newTeacher?._id;

      Alert.alert(
        'Success 🎉',
        `Usthadh ${newUsthadhName} created!\nLogin ID: ${newUsthadhEmail.trim() || newUsthadhPhone.trim() || 'Auto'}\nPassword: ${newUsthadhPassword.trim() || 'Usthadh@123456'}`
      );
      setNewUsthadhName('');
      setNewUsthadhEmail('');
      setNewUsthadhPassword('');
      setNewUsthadhPhone('');
      setShowUsthadhPickerModal(false);
      await loadData();

      if (usthadhPickerMode === 'create_class') {
        setNewClassTeacherId(newTeacherId);
      } else if (usthadhPickerMode === 'change_class_usthadh' && selectedClass) {
        await apiClient.put(`/classes/${selectedClass._id}`, { teacherId: newTeacherId });
        setSelectedClass((prev: any) => ({ ...prev, teacherId: newTeacher }));
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create new Usthadh');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Enrol Students from Selected Family to Class
  const handleEnrolFamilyChildren = async () => {
    if (!selectedClass || !selectedFamilyForClass || selectedFamilyMemberIds.length === 0) {
      Alert.alert('Selection Missing', 'Please select at least one child from the family.');
      return;
    }

    try {
      setActionLoading(true);
      const guardianId = selectedFamilyForClass.headMemberId?._id || selectedFamilyForClass.headMemberId;

      await Promise.all(
        selectedFamilyMemberIds.map((memberId) =>
          apiClient.post('/students', {
            memberId,
            classId: selectedClass._id,
            familyId: selectedFamilyForClass._id,
            guardianId,
            status: 'active',
          })
        )
      );

      Alert.alert('Success 🎉', 'Children enrolled into class successfully!');
      setShowAddStudentsModal(false);
      setSelectedFamilyForClass(null);
      setSelectedFamilyMemberIds([]);
      await loadData();
      handleOpenClassDetails(selectedClass);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to enrol children');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Assign Existing Students to Class
  const handleAssignExistingStudents = async () => {
    if (!selectedClass || selectedExistingStudentIds.length === 0) return;

    try {
      setActionLoading(true);
      await Promise.all(
        selectedExistingStudentIds.map((id) =>
          apiClient.put(`/students/${id}`, { classId: selectedClass._id })
        )
      );

      Alert.alert('Success 🎉', 'Assigned students to class!');
      setShowAddStudentsModal(false);
      setSelectedExistingStudentIds([]);
      await loadData();
      handleOpenClassDetails(selectedClass);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to assign students');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Remove Student from Class
  const handleRemoveStudentFromClass = async (studentId: string, studentName: string) => {
    Alert.alert(
      'Remove Student',
      `Are you sure you want to remove ${studentName || 'this student'} from ${selectedClass?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.put(`/students/${studentId}`, { classId: null });
              setClassStudents((prev) => prev.filter((s) => s._id !== studentId));
              loadData();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove student from class');
            }
          },
        },
      ]
    );
  };

  // Filtered families for search
  const filteredFamilies = families.filter((f) => {
    const q = familySearchQuery.toLowerCase();
    const code = f.familyCode?.toLowerCase() || '';
    const head = f.headMemberId?.name?.toLowerCase() || f.headName?.toLowerCase() || '';
    const house = f.address?.line1?.toLowerCase() || '';
    const ward = f.wardNo?.toLowerCase() || '';
    return code.includes(q) || head.includes(q) || house.includes(q) || ward.includes(q);
  });

  // Filtered Usthadhs and Members for Usthadh Search
  const filteredTeachers = teachers.filter((t) => {
    const q = usthadhSearchQuery.toLowerCase();
    const name = t.memberId?.name?.toLowerCase() || t.name?.toLowerCase() || '';
    const phone = t.memberId?.phone?.toLowerCase() || t.phone?.toLowerCase() || '';
    return name.includes(q) || phone.includes(q);
  });

  const filteredMembers = members.filter((m) => {
    const q = usthadhSearchQuery.toLowerCase();
    const name = m.name?.toLowerCase() || '';
    const phone = m.phone?.toLowerCase() || '';
    const isAlreadyTeacher = teachers.some((t) => (t.memberId?._id || t.memberId) === m._id);
    return !isAlreadyTeacher && (name.includes(q) || phone.includes(q));
  });

  // Quick enroll family members fetcher
  const handleSelectQuickFamily = async (fam: any) => {
    setEnrollFamilyId(fam._id);
    setEnrollMemberId('');
    setShowEnrollFamilyModal(false);

    try {
      setFetchingEnrollMembers(true);
      const res = await apiClient.get(`/families/${fam._id}`);
      const famData = res.data?.data;
      setEnrollFamilyMembers(famData?.members || fam.members || []);
    } catch {
      setEnrollFamilyMembers(fam.members || []);
    } finally {
      setFetchingEnrollMembers(false);
    }
  };

  // Quick single-student enrollment submit
  const handleQuickEnrollSubmit = async () => {
    if (!enrollFamilyId) {
      Alert.alert('Missing Selection', 'Please select a Family.');
      return;
    }
    if (!enrollMemberId) {
      Alert.alert('Missing Selection', 'Please select a child/member from the family.');
      return;
    }
    if (!enrollClassId) {
      Alert.alert('Missing Selection', 'Please select a Class.');
      return;
    }

    try {
      setActionLoading(true);
      const fam = families.find((f) => f._id === enrollFamilyId);
      const guardianId = fam?.headMemberId?._id || fam?.headMemberId;

      await apiClient.post('/students', {
        memberId: enrollMemberId,
        familyId: enrollFamilyId,
        classId: enrollClassId,
        guardianId,
        admissionNo: enrollAdmissionNo.trim() || undefined,
        status: 'active',
      });

      Alert.alert('Success 🎉', 'Student successfully enrolled in Madrasa class!', [
        {
          text: 'OK',
          onPress: () => {
            setEnrollMemberId('');
            setEnrollAdmissionNo('');
            loadData();
            setActiveMainTab('classes');
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Enrollment Error', err.response?.data?.message || 'Failed to enroll student.');
    } finally {
      setActionLoading(false);
    }
  };

  const assignedUsthadhName =
    teachers.find((t) => t._id === newClassTeacherId)?.memberId?.name ||
    teachers.find((t) => t._id === newClassTeacherId)?.name;

  if (fetchingData) {
    return (
      <View style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={TEAL} />
        <Text style={{ marginTop: 12, color: TEAL_DARK, fontWeight: '700' }}>Loading Sadar Mualim Panel...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      {/* Top Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderColor: '#f1ebd9',
          backgroundColor: 'white',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#f8fafc',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={TEAL_DARK} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: TEAL_DARK }}>Sadar Mualim Panel</Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>സദർ മുഅല്ലിം & മദ്രസ മാനേജ്‌മെന്റ്</Text>
          </View>
        </View>

        {activeMainTab === 'classes' && (
          <TouchableOpacity
            onPress={() => setShowCreateClassModal(true)}
            style={{
              backgroundColor: TEAL,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>New Class</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Tab Switcher */}
      <View style={{ flexDirection: 'row', padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1ebd9', gap: 8 }}>
        <TouchableOpacity
          onPress={() => setActiveMainTab('classes')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: activeMainTab === 'classes' ? TEAL : '#f8fafc',
          }}
        >
          <Text style={{ color: activeMainTab === 'classes' ? 'white' : '#64748b', fontWeight: '800', fontSize: 13 }}>
            📚 Classes & Usthadhs ({classes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveMainTab('enroll')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: activeMainTab === 'enroll' ? TEAL : '#f8fafc',
          }}
        >
          <Text style={{ color: activeMainTab === 'enroll' ? 'white' : '#64748b', fontWeight: '800', fontSize: 13 }}>
            🏠 Family Enrolment
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: CLASSES & USTHADHS */}
      {/* ========================================================================= */}
      {activeMainTab === 'classes' && (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={TEAL} />}
        >
          {classes.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center', backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#ebdcb9' }}>
              <Ionicons name="book-outline" size={44} color="#94a3b8" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: TEAL_DARK, marginTop: 12 }}>No Classes Created</Text>
              <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
                Create your first Madrasa class, assign an Usthadh from members, and enroll students.
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateClassModal(true)}
                style={{ backgroundColor: TEAL, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
              >
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>+ Create Class Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            classes.map((cls) => {
              const teacher = cls.teacherId?.memberId?.name || (typeof cls.teacherId === 'object' ? cls.teacherId?.name : null);
              const teacherPhone = cls.teacherId?.memberId?.phone || null;

              return (
                <TouchableOpacity
                  key={cls._id}
                  activeOpacity={0.85}
                  onPress={() => handleOpenClassDetails(cls)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#ebdcb9',
                    shadowColor: TEAL_DARK,
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 17, fontWeight: '900', color: TEAL_DARK }}>{cls.name}</Text>
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Level {cls.level} • Academic Year: {cls.academicYear || '2026-2027'}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#ecfdf5',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#a7f3d0',
                      }}
                    >
                      <Text style={{ color: TEAL, fontWeight: '800', fontSize: 11 }}>Manage Class</Text>
                    </View>
                  </View>

                  {/* Usthadh Row */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f8fafc',
                      padding: 10,
                      borderRadius: 12,
                      marginTop: 12,
                    }}
                  >
                    <Ionicons name="person" size={16} color={TEAL} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: '#475569', flex: 1 }}>
                      Usthadh: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{teacher || 'Not Assigned'}</Text>
                    </Text>
                    {teacherPhone && (
                      <Text style={{ fontSize: 11, color: '#64748b' }}>📞 {teacherPhone}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUICK FAMILY ENROLLMENT */}
      {/* ========================================================================= */}
      {activeMainTab === 'enroll' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Step 1: Select Family */}
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#ebdcb9' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: TEAL_DARK, marginBottom: 8 }}>
              1. Select Family (കുടുംബം തിരഞ്ഞെടുക്കുക) *
            </Text>
            <TouchableOpacity
              onPress={() => setShowEnrollFamilyModal(true)}
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1.5,
                borderColor: enrollFamilyId ? TEAL : '#e2e8f0',
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: enrollFamilyId ? '#0f172a' : '#94a3b8', fontSize: 14, fontWeight: enrollFamilyId ? '700' : 'normal' }}>
                {enrollFamilyId
                  ? `${families.find((f) => f._id === enrollFamilyId)?.familyCode} - ${families.find((f) => f._id === enrollFamilyId)?.headMemberId?.name || 'Head'}`
                  : 'Search & Pick Family from List'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={TEAL} />
            </TouchableOpacity>
          </View>

          {/* Step 2: Select Child / Member */}
          {enrollFamilyId && (
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#ebdcb9' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: TEAL_DARK, marginBottom: 8 }}>
                2. Select Child / Member to Enroll *
              </Text>
              {fetchingEnrollMembers ? (
                <ActivityIndicator color={TEAL} style={{ padding: 12 }} />
              ) : enrollFamilyMembers.length === 0 ? (
                <Text style={{ fontSize: 12, color: '#64748b' }}>No members in this family.</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {enrollFamilyMembers.map((m: any) => {
                    const member = m.memberId || m;
                    const isSelected = enrollMemberId === (member._id || m.memberId);
                    return (
                      <TouchableOpacity
                        key={member._id || m.memberId}
                        onPress={() => setEnrollMemberId(member._id || m.memberId)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: isSelected ? TEAL : '#e2e8f0',
                          backgroundColor: isSelected ? '#f0fdf4' : '#f8fafc',
                        }}
                      >
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{member.name}</Text>
                          <Text style={{ fontSize: 11, color: '#64748b' }}>
                            {m.relationship || 'Member'} {member.gender ? `• ${member.gender}` : ''}
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color={TEAL} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Step 3: Select Class */}
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#ebdcb9' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: TEAL_DARK, marginBottom: 8 }}>
              3. Select Madrasa Class (ക്ലാസ്) *
            </Text>
            <TouchableOpacity
              onPress={() => setShowEnrollClassModal(true)}
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1.5,
                borderColor: enrollClassId ? TEAL : '#e2e8f0',
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: enrollClassId ? '#0f172a' : '#94a3b8', fontSize: 14, fontWeight: enrollClassId ? '700' : 'normal' }}>
                {enrollClassId
                  ? classes.find((c) => c._id === enrollClassId)?.name || 'Class'
                  : 'Select Class from List'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={TEAL} />
            </TouchableOpacity>
          </View>

          {/* Admission Number */}
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#ebdcb9' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: TEAL_DARK, marginBottom: 8 }}>
              4. Admission No (Optional / Auto-generated)
            </Text>
            <TextInput
              placeholder="e.g. STD0012 (leave blank to auto-generate)"
              value={enrollAdmissionNo}
              onChangeText={setEnrollAdmissionNo}
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: '#0f172a',
              }}
            />
          </View>

          {/* Submit Enroll Button */}
          <TouchableOpacity
            onPress={handleQuickEnrollSubmit}
            disabled={actionLoading}
            style={{
              backgroundColor: TEAL,
              padding: 16,
              borderRadius: 16,
              alignItems: 'center',
              shadowColor: TEAL,
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 3,
              marginBottom: 30,
            }}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Enrol Student to Madrasa (ചേർക്കുക)</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLASS DETAILS & STUDENT MANAGEMENT */}
      {/* ========================================================================= */}
      <Modal visible={!!selectedClass} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '88%', padding: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderColor: '#f1ebd9' }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: TEAL_DARK }}>{selectedClass?.name}</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  Level {selectedClass?.level} • {classStudents.length} Students Enrolled
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedClass(null)} style={{ padding: 6, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 14, gap: 16 }}>
              {/* Usthadh Section */}
              <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: TEAL_DARK }}>Class Usthadh (ക്ലാസ് ഉസ്താദ്)</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setUsthadhPickerMode('change_class_usthadh');
                      setUsthadhSearchQuery('');
                      setUsthadhSubTab('search');
                      setShowUsthadhPickerModal(true);
                    }}
                    style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}
                  >
                    <Text style={{ color: TEAL, fontWeight: '800', fontSize: 11 }}>
                      {selectedClass?.teacherId ? 'Change Usthadh' : '+ Assign Usthadh'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>
                  {selectedClass?.teacherId?.memberId?.name || selectedClass?.teacherId?.name || 'No Usthadh Assigned'}
                </Text>
                {selectedClass?.teacherId?.memberId?.phone && (
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    📞 {selectedClass.teacherId.memberId.phone}
                  </Text>
                )}
              </View>

              {/* Students Header & Actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: TEAL_DARK }}>
                  Enrolled Students ({classStudents.length})
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setAddStudentsTab('family');
                    setShowAddStudentsModal(true);
                  }}
                  style={{
                    backgroundColor: TEAL,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>+ Add Students</Text>
                </TouchableOpacity>
              </View>

              {/* Students List */}
              {fetchingClassStudents ? (
                <ActivityIndicator color={TEAL} style={{ padding: 20 }} />
              ) : classStudents.length === 0 ? (
                <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16 }}>
                  <Ionicons name="school-outline" size={36} color="#94a3b8" />
                  <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 13, marginTop: 8 }}>No students enrolled yet</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                    Tap "+ Add Students" to select children from Mahallu families.
                  </Text>
                </View>
              ) : (
                classStudents.map((std) => (
                  <View
                    key={std._id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 12,
                      backgroundColor: 'white',
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
                        {std.memberId?.name || 'Student'}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Adm: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{std.admissionNo}</Text>
                        {std.familyId?.familyCode ? ` • Family: ${std.familyId.familyCode}` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveStudentFromClass(std._id, std.memberId?.name)}
                      style={{ padding: 6, backgroundColor: '#fee2e2', borderRadius: 10 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREATE CLASS */}
      {/* ========================================================================= */}
      <Modal visible={showCreateClassModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f1ebd9' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: TEAL_DARK }}>Create Madrasa Class</Text>
              <TouchableOpacity onPress={() => setShowCreateClassModal(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 14, gap: 12 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>Class Name (പേര്) *</Text>
                <TextInput
                  placeholder="e.g. Class 1 A / ഒന്നാം ക്ലാസ്"
                  value={newClassName}
                  onChangeText={setNewClassName}
                  style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>Level (1-12) *</Text>
                  <TextInput
                    placeholder="1"
                    keyboardType="numeric"
                    value={newClassLevel}
                    onChangeText={setNewClassLevel}
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>Academic Year *</Text>
                  <TextInput
                    placeholder="2026-2027"
                    value={newClassYear}
                    onChangeText={setNewClassYear}
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                  />
                </View>
              </View>

              {/* Usthadh Selection Field */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>
                  Assign Class Usthadh (ഉസ്താദിനെ തിരഞ്ഞെടുക്കുക)
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setUsthadhPickerMode('create_class');
                    setUsthadhSearchQuery('');
                    setUsthadhSubTab('search');
                    setShowUsthadhPickerModal(true);
                  }}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderWidth: 1.5,
                    borderColor: newClassTeacherId ? TEAL : '#e2e8f0',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: newClassTeacherId ? '#0f172a' : '#94a3b8', fontSize: 14, fontWeight: newClassTeacherId ? '800' : 'normal' }}>
                    {assignedUsthadhName ? `Usthadh: ${assignedUsthadhName}` : '🔍 Search Members or Add New Usthadh'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={TEAL} />
                </TouchableOpacity>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>Subjects (വിഷയങ്ങൾ)</Text>
                <TextInput
                  placeholder="Quran, Fiqh, Arabic, Thareekh"
                  value={newClassSubjects}
                  onChangeText={setNewClassSubjects}
                  style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                />
              </View>

              <TouchableOpacity
                onPress={handleCreateClass}
                disabled={actionLoading}
                style={{ backgroundColor: TEAL, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 10 }}
              >
                {actionLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>Create Class (ക്ലാസ് ചേർക്കുക)</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* UNIFIED MODAL: SEARCH USTHADHS / MEMBERS & ADD NEW USTHADH */}
      {/* ========================================================================= */}
      <Modal visible={showUsthadhPickerModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '85%', padding: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f1ebd9' }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: TEAL_DARK }}>Choose / Add Usthadh</Text>
              <TouchableOpacity onPress={() => setShowUsthadhPickerModal(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Sub-tab Switcher */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              <TouchableOpacity
                onPress={() => setUsthadhSubTab('search')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: usthadhSubTab === 'search' ? TEAL : '#f1f5f9',
                }}
              >
                <Text style={{ color: usthadhSubTab === 'search' ? 'white' : '#64748b', fontWeight: '800', fontSize: 12 }}>
                  🔍 Search Usthadhs & Members
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setUsthadhSubTab('new')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: usthadhSubTab === 'new' ? TEAL : '#f1f5f9',
                }}
              >
                <Text style={{ color: usthadhSubTab === 'new' ? 'white' : '#64748b', fontWeight: '800', fontSize: 12 }}>
                  + Add New Usthadh
                </Text>
              </TouchableOpacity>
            </View>

            {/* SUB-TAB 1: SEARCH USTHADHS & MEMBERS */}
            {usthadhSubTab === 'search' && (
              <ScrollView contentContainerStyle={{ gap: 10 }}>
                <TextInput
                  placeholder="Search Usthadh or Member by name or phone..."
                  value={usthadhSearchQuery}
                  onChangeText={setUsthadhSearchQuery}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    borderRadius: 12,
                    padding: 10,
                    fontSize: 13,
                    color: '#0f172a',
                    marginBottom: 6,
                  }}
                />

                {/* Section 1: Registered Teachers */}
                <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginTop: 4 }}>
                  Registered Usthadhs ({filteredTeachers.length})
                </Text>
                {filteredTeachers.length === 0 ? (
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', paddingLeft: 4 }}>
                    No registered teachers matching search.
                  </Text>
                ) : (
                  filteredTeachers.map((t) => (
                    <TouchableOpacity
                      key={t._id}
                      onPress={() =>
                        handleSelectUsthadh({
                          teacherId: t._id,
                          name: t.memberId?.name || t.name,
                          phone: t.memberId?.phone || t.phone,
                        })
                      }
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: '#f0fdf4',
                        borderWidth: 1,
                        borderColor: '#bbf7d0',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
                          {t.memberId?.name || t.name || 'Usthadh'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>
                          {t.qualification || 'Teacher'} {t.memberId?.phone ? `• 📞 ${t.memberId.phone}` : ''}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: TEAL, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 10 }}>Select</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}

                {/* Section 2: Mahallu Members (can be selected as Usthadh) */}
                <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginTop: 12 }}>
                  Or Choose from Mahallu Members ({filteredMembers.slice(0, 15).length})
                </Text>
                {filteredMembers.slice(0, 15).map((m) => (
                  <TouchableOpacity
                    key={m._id}
                    onPress={() =>
                      handleSelectUsthadh({
                        memberId: m._id,
                        name: m.name,
                        phone: m.phone,
                      })
                    }
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: '#f8fafc',
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{m.name}</Text>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>
                        Member {m.phone ? `• 📞 ${m.phone}` : ''}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: '#334155', fontWeight: '800', fontSize: 10 }}>Make Usthadh</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Prompt to create new if not found */}
                <TouchableOpacity
                  onPress={() => setUsthadhSubTab('new')}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: TEAL,
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    marginTop: 10,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ color: TEAL, fontWeight: '800', fontSize: 13 }}>
                    + Usthadh not in list? Add New Usthadh Here
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* SUB-TAB 2: ADD NEW USTHADH */}
            {usthadhSubTab === 'new' && (
              <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 6 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>
                    Usthadh Full Name (ഉസ്താദിന്റെ പേര്) *
                  </Text>
                  <TextInput
                    placeholder="e.g. Usthadh Mohammed Faizy"
                    value={newUsthadhName}
                    onChangeText={setNewUsthadhName}
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>
                    Login ID / Email (ലോഗിൻ ഐഡി) *
                  </Text>
                  <TextInput
                    placeholder="e.g. faizy@mahallu.app or usthadh.ahmed"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={newUsthadhEmail}
                    onChangeText={setNewUsthadhEmail}
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>
                    Login Password (പാസ്‌വേഡ്) *
                  </Text>
                  <TextInput
                    placeholder="e.g. Usthadh@123456"
                    autoCapitalize="none"
                    secureTextEntry
                    value={newUsthadhPassword}
                    onChangeText={setNewUsthadhPassword}
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>
                    Phone Number (ഫോൺ നമ്പർ)
                  </Text>
                  <TextInput
                    placeholder="+91 9876543210"
                    keyboardType="phone-pad"
                    value={newUsthadhPhone}
                    onChangeText={setNewUsthadhPhone}
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>
                    Sanad / Qualification (യോഗ്യത)
                  </Text>
                  <TextInput
                    placeholder="e.g. Faizy, Alim, Hafiz, Baqavi"
                    value={newUsthadhQualification}
                    onChangeText={setNewUsthadhQualification}
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleCreateNewUsthadh}
                  disabled={actionLoading}
                  style={{
                    backgroundColor: TEAL,
                    padding: 15,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginTop: 14,
                  }}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>
                      Create & Select Usthadh (ഉസ്താദിനെ ചേർക്കുക)
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD STUDENTS FROM FAMILY / EXISTING */}
      {/* ========================================================================= */}
      <Modal visible={showAddStudentsModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '85%', padding: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f1ebd9' }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: TEAL_DARK }}>
                Enrol Students to {selectedClass?.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddStudentsModal(false);
                  setSelectedFamilyForClass(null);
                  setSelectedFamilyMemberIds([]);
                  setSelectedExistingStudentIds([]);
                }}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Sub-tab Switcher */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              <TouchableOpacity
                onPress={() => setAddStudentsTab('family')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: addStudentsTab === 'family' ? TEAL : '#f1f5f9',
                }}
              >
                <Text style={{ color: addStudentsTab === 'family' ? 'white' : '#64748b', fontWeight: '800', fontSize: 12 }}>
                  From Family (കുടുംബം)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAddStudentsTab('existing')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: addStudentsTab === 'existing' ? TEAL : '#f1f5f9',
                }}
              >
                <Text style={{ color: addStudentsTab === 'existing' ? 'white' : '#64748b', fontWeight: '800', fontSize: 12 }}>
                  Existing Students
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB: FROM FAMILY */}
            {addStudentsTab === 'family' && (
              <ScrollView contentContainerStyle={{ gap: 14 }}>
                {/* Family Search */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK, marginBottom: 4 }}>
                    1. Search & Select Family *
                  </Text>
                  <TextInput
                    placeholder="Search by Code, Head Name, House..."
                    value={familySearchQuery}
                    onChangeText={setFamilySearchQuery}
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 10, fontSize: 13, color: '#0f172a' }}
                  />

                  {/* Family Quick List */}
                  <View style={{ maxHeight: 130, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 6, backgroundColor: '#f8fafc' }}>
                    <ScrollView nestedScrollEnabled>
                      {filteredFamilies.slice(0, 10).map((f) => {
                        const isChosen = selectedFamilyForClass?._id === f._id;
                        return (
                          <TouchableOpacity
                            key={f._id}
                            onPress={() => {
                              setSelectedFamilyForClass(f);
                              setSelectedFamilyMemberIds([]);
                            }}
                            style={{
                              padding: 10,
                              borderBottomWidth: 1,
                              borderColor: '#e2e8f0',
                              backgroundColor: isChosen ? '#dcfce7' : 'transparent',
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>
                              {f.familyCode} - {f.headMemberId?.name || f.headName || 'Family Head'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                {/* Family Members Selection */}
                {selectedFamilyForClass && (
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: TEAL_DARK }}>
                      2. Select Children ({selectedFamilyMemberIds.length} chosen)
                    </Text>
                    {selectedFamilyForClass.members?.map((m: any) => {
                      const member = m.memberId || m;
                      const memberId = member._id || m.memberId;
                      const isSelected = selectedFamilyMemberIds.includes(memberId);

                      return (
                        <TouchableOpacity
                          key={memberId}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedFamilyMemberIds((prev) => prev.filter((id) => id !== memberId));
                            } else {
                              setSelectedFamilyMemberIds((prev) => [...prev, memberId]);
                            }
                          }}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: isSelected ? TEAL : '#e2e8f0',
                            backgroundColor: isSelected ? '#f0fdf4' : '#f8fafc',
                          }}
                        >
                          <View>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{member.name}</Text>
                            <Text style={{ fontSize: 11, color: '#64748b' }}>
                              {m.relationship || 'Child'} {member.gender ? `• ${member.gender}` : ''}
                            </Text>
                          </View>
                          {isSelected && <Ionicons name="checkmark-circle" size={20} color={TEAL} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleEnrolFamilyChildren}
                  disabled={actionLoading || selectedFamilyMemberIds.length === 0}
                  style={{
                    backgroundColor: TEAL,
                    padding: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginTop: 10,
                    opacity: selectedFamilyMemberIds.length > 0 ? 1 : 0.5,
                  }}
                >
                  {actionLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>Enrol Selected Children</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* TAB: EXISTING STUDENTS */}
            {addStudentsTab === 'existing' && (
              <ScrollView contentContainerStyle={{ gap: 10 }}>
                {allStudents.filter((s) => s.classId?._id !== selectedClass?._id).map((s) => {
                  const isSelected = selectedExistingStudentIds.includes(s._id);
                  return (
                    <TouchableOpacity
                      key={s._id}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedExistingStudentIds((prev) => prev.filter((id) => id !== s._id));
                        } else {
                          setSelectedExistingStudentIds((prev) => [...prev, s._id]);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: isSelected ? TEAL : '#e2e8f0',
                        backgroundColor: isSelected ? '#f0fdf4' : '#f8fafc',
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{s.memberId?.name}</Text>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>
                          Adm: {s.admissionNo} • Current: {s.classId?.name || 'None'}
                        </Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={TEAL} />}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  onPress={handleAssignExistingStudents}
                  disabled={actionLoading || selectedExistingStudentIds.length === 0}
                  style={{
                    backgroundColor: TEAL,
                    padding: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginTop: 10,
                    opacity: selectedExistingStudentIds.length > 0 ? 1 : 0.5,
                  }}
                >
                  {actionLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>Assign to Class</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* QUICK ENROLL FAMILY MODAL */}
      <Modal visible={showEnrollFamilyModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f1ebd9' }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: TEAL_DARK }}>Pick Family</Text>
              <TouchableOpacity onPress={() => setShowEnrollFamilyModal(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Search family..."
              value={familySearchQuery}
              onChangeText={setFamilySearchQuery}
              style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 10, fontSize: 13, marginVertical: 10 }}
            />

            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {filteredFamilies.map((fam) => (
                <TouchableOpacity
                  key={fam._id}
                  onPress={() => handleSelectQuickFamily(fam)}
                  style={{ padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
                    {fam.familyCode} - {fam.headMemberId?.name || fam.headName || 'Family Head'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{fam.address?.line1 || 'House Name'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QUICK ENROLL CLASS MODAL */}
      <Modal visible={showEnrollClassModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f1ebd9' }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: TEAL_DARK }}>Select Class</Text>
              <TouchableOpacity onPress={() => setShowEnrollClassModal(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10, gap: 8 }}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls._id}
                  onPress={() => {
                    setEnrollClassId(cls._id);
                    setShowEnrollClassModal(false);
                  }}
                  style={{ padding: 14, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{cls.name}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Level {cls.level} • Year: {cls.academicYear || '2026-2027'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
