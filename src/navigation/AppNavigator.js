import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import TasksScreen from '../screens/TasksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateProjectScreen from '../screens/CreateProjectScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import EditProjectScreen from '../screens/EditProjectScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MembersScreen from '../screens/MembersScreen';
import AddMemberScreen from '../screens/AddMemberScreen';
import EditMemberScreen from '../screens/EditMemberScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import AssignTaskScreen from '../screens/AssignTaskScreen';
import SelectMemberScreen from '../screens/SelectMemberScreen';
import SelectTaskScreen from '../screens/SelectTaskScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AddTask" 
      component={AddTaskScreen}
      options={{ title: 'Add New Task' }}
    />
    <Stack.Screen 
      name="EditTask" 
      component={EditTaskScreen}
      options={{ title: 'Edit Task' }}
    />
    <Stack.Screen 
      name="AssignTask" 
      component={AssignTaskScreen}
      options={{ title: 'Assign Task' }}
    />
  </Stack.Navigator>
);

const TasksStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Tasks" 
      component={TasksScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="CreateTask" 
      component={CreateTaskScreen}
      options={{ 
        title: 'Create New Task',
        headerStyle: {
          backgroundColor: '#F8F9FA',
        },
        headerTintColor: '#1C1C1E',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    />
    <Stack.Screen 
      name="EditTask" 
      component={EditTaskScreen}
      options={{ title: 'Edit Task' }}
    />
    <Stack.Screen 
      name="AssignTask" 
      component={AssignTaskScreen}
      options={{ title: 'Assign Task' }}
    />
  </Stack.Navigator>
);

const ProjectsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Projects" 
      component={ProjectsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="ProjectDetails" 
      component={ProjectDetailsScreen}
      options={{ title: 'Project Details' }}
    />
    <Stack.Screen 
      name="CreateProject" 
      component={CreateProjectScreen}
      options={{ 
        title: 'Create New Project',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F8F9FA',
        },
        headerTintColor: '#1C1C1E',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    />
    <Stack.Screen 
      name="AddProject" 
      component={AddProjectScreen}
      options={{ title: 'Add New Project' }}
    />
    <Stack.Screen 
      name="EditProject" 
      component={EditProjectScreen}
      options={{ title: 'Edit Project' }}
    />
    <Stack.Screen 
      name="SelectMember" 
      component={SelectMemberScreen}
      options={{ title: 'Select Member' }}
    />
    <Stack.Screen 
      name="SelectTask" 
      component={SelectTaskScreen}
      options={{ title: 'Select Task' }}
    />
    <Stack.Screen 
      name="AddMemberToProject" 
      component={AddMemberScreen}
      options={{ title: 'Add Member to Project' }}
    />
  </Stack.Navigator>
);

const MembersStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Members" 
      component={MembersScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AddMember" 
      component={AddMemberScreen}
      options={{ title: 'Add New Member' }}
    />
    <Stack.Screen 
      name="EditMember" 
      component={EditMemberScreen}
      options={{ title: 'Edit Member' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileScreen" 
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'HomeTab') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'TasksTab') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'ProjectsTab') {
          iconName = focused ? 'folder' : 'folder-outline';
        } else if (route.name === 'MembersTab') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'ProfileTab') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen 
      name="HomeTab" 
      component={HomeStack}
      options={{ 
        title: 'Home',
        headerShown: false
      }}
    />
    <Tab.Screen 
      name="TasksTab" 
      component={TasksStack}
      options={{ 
        title: 'Tasks',
        headerShown: false
      }}
    />
    <Tab.Screen 
      name="ProjectsTab" 
      component={ProjectsStack}
      options={{ 
        title: 'Projects',
        headerShown: false
      }}
    />
    <Tab.Screen 
      name="MembersTab" 
      component={MembersStack}
      options={{ 
        title: 'Members',
        headerShown: false
      }}
    />
    <Tab.Screen 
      name="ProfileTab" 
      component={ProfileStack}
      options={{ 
        title: 'Profile',
        headerShown: false
      }}
    />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator; 