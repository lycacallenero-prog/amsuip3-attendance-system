import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, BookOpen, TrendingUp, CheckCircle2, BarChart3, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Use the same role caching system as navigation
const getCachedUserRole = (): string | null => {
  try {
    return localStorage.getItem('userRole');
  } catch {
    return null;
  }
};

const getCachedUserId = (): string | null => {
  try {
    return localStorage.getItem('userId');
  } catch {
    return null;
  }
};

const setCachedUserRole = (role: string, userId: string) => {
  try {
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', userId);
  } catch {
    // Ignore localStorage errors
  }
};

let cachedUserRole: string | null = getCachedUserRole();
let cachedUserId: string | null = getCachedUserId();

const generateMockData = (period: 'daily' | 'weekly' | 'monthly') => {
  if (period === 'daily') {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        name: dayName,
        present: Math.floor(Math.random() * 50) + 70, // 70-120
        absent: Math.floor(Math.random() * 10) + 5,   // 5-15
      };
    });
  } else if (period === 'weekly') {
    return Array.from({ length: 8 }, (_, i) => ({
      name: `Week ${i + 1}`,
      present: Math.floor(Math.random() * 100) + 200,  // 200-300
      absent: Math.floor(Math.random() * 30) + 10,     // 10-40
    }));
  } else { // monthly
    return [
      { name: 'Jan', present: 240, absent: 15 },
      { name: 'Feb', present: 230, absent: 20 },
      { name: 'Mar', present: 250, absent: 12 },
      { name: 'Apr', present: 260, absent: 10 },
      { name: 'May', present: 270, absent: 8 },
      { name: 'Jun', present: 280, absent: 5 },
      { name: 'Jul', present: 290, absent: 4 },
      { name: 'Aug', present: 300, absent: 3 },
    ];
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>(() => {
    // Initialize with cached role if available
    return cachedUserRole || 'user';
  });
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [chartData, setChartData] = useState<Array<{name: string, present: number, absent: number}>>([]);
  
  // Recent Sessions interface and state
  interface RecentSession {
    id: string;
    course: string;
    students: number;
    time: string;
    timeAgo: string;
    status: 'completed' | 'ongoing' | 'upcoming';
    attendanceRate?: number;
  }
  
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  // Fetch recent attendance sessions
  const fetchRecentSessions = useCallback(async () => {
    try {
      // For now, using mock data. In a real app, this would fetch from attendance_records table
      const mockSessions: RecentSession[] = [
        {
          id: '1',
          course: 'CS 101 - Introduction to Programming',
          students: 45,
          time: '9:00 AM - 10:30 AM',
          timeAgo: '2 min ago',
          status: 'completed',
          attendanceRate: 93
        },
        {
          id: '2',
          course: 'MATH 201 - Calculus II',
          students: 38,
          time: '11:00 AM - 12:30 PM',
          timeAgo: '15 min ago',
          status: 'ongoing',
          attendanceRate: 87
        },
        {
          id: '3',
          course: 'ENG 101 - English Composition',
          students: 42,
          time: '2:00 PM - 3:30 PM',
          timeAgo: '1 hour ago',
          status: 'upcoming'
        },
        {
          id: '4',
          course: 'PHY 101 - Physics Fundamentals',
          students: 35,
          time: '4:00 PM - 5:30 PM',
          timeAgo: '3 hours ago',
          status: 'completed',
          attendanceRate: 91
        }
      ];
      
      setRecentSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchTotalStudents();
    fetchRecentSessions();
  }, [user]);

  const fetchUserProfile = async () => {
    // If we have cached role for the same user, don't refetch
    if (cachedUserRole && cachedUserId === user?.id) {
      setUserRole(cachedUserRole);
      // Still fetch profile for other data, but don't wait for it
      fetchProfileData();
      return;
    }

    if (!user) {
      const defaultRole = 'user';
      setUserRole(defaultRole);
      cachedUserRole = defaultRole;
      cachedUserId = null;
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
      
      // Update role cache
      const role = data.role || 'user';
      setUserRole(role);
      cachedUserRole = role;
      cachedUserId = user.id;
      setCachedUserRole(role, user.id);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      const defaultRole = 'user';
      setUserRole(defaultRole);
      if (user?.id) {
        cachedUserRole = defaultRole;
        cachedUserId = user.id;
        setCachedUserRole(defaultRole, user.id);
      }
    }
  };

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchTotalStudents = async () => {
    try {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      setTotalStudents(count || 0);
    } catch (error) {
      console.error('Error fetching total students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle session click
  const handleSessionClick = (session: RecentSession) => {
    if (session.status === 'ongoing') {
      navigate('/take-attendance');
    } else if (session.status === 'completed') {
      navigate('/records');
    } else {
      navigate('/schedule');
    }
  };



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getDashboardTitle = () => {
    const roleLabels = {
      admin: 'Admin',
      instructor: 'Instructor',
      user: 'User'
    };
    return `${roleLabels[userRole] || 'User'} Dashboard`;
  };

  const getUserDisplayName = () => {
    // Don't show email while profile is still loading
    if (loading && !userProfile) {
      return '';
    }
    
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Update chart data when time period changes
  useEffect(() => {
    setChartData(generateMockData(timePeriod));
  }, [timePeriod]);

  // Calculate percentages for the chart
  const chartDataWithPercentage = useMemo(() => {
    return chartData.map(item => ({
      ...item,
      presentPercentage: Math.round((item.present / (item.present + item.absent)) * 100),
      absentPercentage: Math.round((item.absent / (item.present + item.absent)) * 100)
    }));
  }, [chartData]);

  return (
    <div className="flex-1 space-y-4 px-6 py-4 opacity-100 transition-opacity duration-300">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{getDashboardTitle()}</h2>
          <p className="text-sm text-gray-600">
            {getGreeting()}! Here's your attendance overview.
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '' : totalStudents.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500">
              Enrolled students
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Sessions</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
              <CalendarDays className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">8</div>
            <p className="text-sm text-gray-500">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">94.2%</div>
            <p className="text-sm text-gray-500">
              +1.2% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-600">Active Classes</CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <BookOpen className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">24</div>
            <p className="text-sm text-gray-500">
              Across all programs
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart and Recent Sessions Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Attendance Overview</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  {timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} attendance trends
                </CardDescription>
              </div>
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-4 py-2 text-sm rounded-md transition-colors font-medium ${
                      timePeriod === period
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pl-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataWithPercentage}
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
                barGap={0}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: '#6b7280',
                    textAnchor: 'end',
                    dx: -5
                  }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                  width={40}
                  tickMargin={0}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: '#6b7280',
                    dy: 5
                  }}
                  padding={{ left: 15, right: 15 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '0.75rem',
                  }}
                  formatter={(value, name) => {
                    const index = chartDataWithPercentage.findIndex(item => 
                      item.presentPercentage === value || item.absentPercentage === value
                    );
                    const data = chartDataWithPercentage[index];
                    const total = data.present + data.absent;
                    const count = name === 'Present' ? data.present : data.absent;
                    return [`${value}% (${count}/${total})`, name];
                  }}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-muted-foreground">
                      {value} ({value === 'Present' ? '↑' : '↓'})
                    </span>
                  )}
                />
                <Bar 
                  dataKey="presentPercentage" 
                  name="Present"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="absentPercentage" 
                  name="Absent"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Attendance Sessions */}
        <Card className="col-span-3 bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Sessions</CardTitle>
                <CardDescription className="text-gray-600">
                  Latest attendance activities
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/records')}
                className="h-8 px-3 text-xs"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.length > 0 ? (
                recentSessions.map((session, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${
                      session.status === 'completed' ? 'bg-green-50' : 
                      session.status === 'ongoing' ? 'bg-blue-50' : 'bg-orange-50'
                    }`}>
                      {session.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : session.status === 'ongoing' ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CalendarDays className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.course}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.students} students • {session.time}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 ml-2">
                      {session.timeAgo}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="p-3 bg-gray-50 rounded-lg inline-block mb-3">
                    <CalendarDays className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No recent sessions</p>
                  <p className="text-xs text-gray-400 mt-1">Attendance sessions will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
