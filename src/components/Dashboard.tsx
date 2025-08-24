import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, BookOpen, Clock, TrendingUp, CheckCircle2, Calendar, BarChart3, LineChart } from "lucide-react";
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

  useEffect(() => {
    fetchUserProfile();
    fetchTotalStudents();
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

  const handleViewCalendar = () => {
    navigate('/schedule');
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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-education-navy">{getDashboardTitle()}</h2>
          <p className="text-sm text-muted-foreground">
            {getGreeting()}! Here's your attendance overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleViewCalendar}
            className="bg-gradient-primary shadow-glow h-9 px-4"
          >
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Students Widget */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-blue-300/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6 relative z-10">
            <CardTitle className="text-sm font-semibold text-blue-800">Total Students</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6 relative z-10">
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-blue-900">
                {loading ? '' : totalStudents.toLocaleString()}
              </div>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </div>
            </div>
            <p className="text-sm text-blue-700/70 mt-2 font-medium">
              Enrolled students
            </p>
            <div className="mt-3 w-full bg-blue-200/50 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Today's Sessions Widget */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-purple-300/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6 relative z-10">
            <CardTitle className="text-sm font-semibold text-purple-800">Today's Sessions</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <CalendarDays className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6 relative z-10">
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-purple-900">8</div>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2
              </div>
            </div>
            <p className="text-sm text-purple-700/70 mt-2 font-medium">
              from yesterday
            </p>
            <div className="mt-3 w-full bg-purple-200/50 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Attendance Rate Widget */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6 relative z-10">
            <CardTitle className="text-sm font-semibold text-green-800">Attendance Rate</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6 relative z-10">
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-green-900">94.2%</div>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                +1.2%
              </div>
            </div>
            <p className="text-sm text-green-700/70 mt-2 font-medium">
              from last week
            </p>
            <div className="mt-3 w-full bg-green-200/50 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Active Classes Widget */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/20 to-orange-300/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6 relative z-10">
            <CardTitle className="text-sm font-semibold text-orange-800">Active Classes</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6 relative z-10">
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-orange-900">24</div>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3
              </div>
            </div>
            <p className="text-sm text-orange-700/70 mt-2 font-medium">
              Across all programs
            </p>
            <div className="mt-3 w-full bg-orange-200/50 rounded-full h-1.5">
              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="pt-1">
                <CardTitle className="text-education-navy">Attendance Overview</CardTitle>
                <CardDescription>
                  {timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} attendance trends
                </CardDescription>
              </div>
              <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      timePeriod === period
                        ? 'bg-white text-education-navy shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
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

        <Card className="col-span-3 bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-education-navy">Recent Activity</CardTitle>
            <CardDescription>
              Latest attendance activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <CheckCircle2 className="mr-3 h-4 w-4 text-green-500" />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium leading-none">
                    CS 101 - Introduction to Programming
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attendance taken for 45 students
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">2 min ago</div>
              </div>
              
              <div className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Clock className="mr-3 h-4 w-4 text-orange-500" />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium leading-none">
                    MATH 201 - Calculus II
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Session starting in 15 minutes
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">upcoming</div>
              </div>
              
              <div className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <BarChart3 className="mr-3 h-4 w-4 text-blue-500" />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium leading-none">
                    Weekly Report Generated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attendance summary for Nov 11-17
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">1 hour ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-education-navy">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                className="w-full justify-start h-9 hover:bg-muted hover:text-foreground transition-colors"
                variant="outline"
                onClick={() => navigate('/take-attendance')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Take Attendance
              </Button>
              
              <Button 
                className="w-full justify-start h-9 hover:bg-muted hover:text-foreground transition-colors"
                variant="outline"
                onClick={() => navigate('/students')}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Button>
              
              <Button 
                className="w-full justify-start h-9 hover:bg-muted hover:text-foreground transition-colors"
                variant="outline"
                onClick={() => navigate('/schedule')}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                View Schedule
              </Button>
              
              <Button 
                className="w-full justify-start h-9 hover:bg-muted hover:text-foreground transition-colors"
                variant="outline"
                onClick={() => navigate('/records')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
