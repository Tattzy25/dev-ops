'use client';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Text,
  VStack,
  HStack,
  Avatar,
  useColorModeValue,
  Divider,
  Select,
  Textarea,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import Card from '@/components/card/Card';

interface ProfileData {
  displayName: string;
  email: string;
  bio: string;
  avatar: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoSave: boolean;
  language: string;
}

interface ValidationErrors {
  displayName?: string;
  email?: string;
  bio?: string;
}

export default function ProfileSettings() {
  const textColor = useColorModeValue('navy.700', 'white');
  const bgColor = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  const toast = useToast();

  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    email: '',
    bio: '',
    avatar: '/img/avatars/avatar4.png',
    theme: 'system',
    notifications: true,
    autoSave: true,
    language: 'en',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load profile data from localStorage on component mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('profileData');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfileData(parsed);
      } else {
        // Set default values for new users
        setProfileData(prev => ({
          ...prev,
          displayName: 'User',
          email: 'user@example.com',
        }));
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast({
        title: 'Warning',
        description: 'Could not load saved profile data. Using defaults.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const validateField = (field: keyof ProfileData, value: any): string | undefined => {
    switch (field) {
      case 'displayName':
        if (!value.trim()) return 'Display name is required';
        if (value.length > 50) return 'Display name must be less than 50 characters';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        break;
      case 'bio':
        if (value.length > 500) return 'Bio must be less than 500 characters';
        break;
    }
    return undefined;
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);

    // Real-time validation
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const validateAllFields = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate all fields
    Object.keys(profileData).forEach(key => {
      const field = key as keyof ProfileData;
      const error = validateField(field, profileData[field]);
      if (error) {
        errors[field as keyof ValidationErrors] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateAllFields()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if localStorage is available
      if (typeof Storage === 'undefined') {
        throw new Error('Local storage is not supported in this browser.');
      }

      // Save to localStorage with error handling
      localStorage.setItem('profileData', JSON.stringify(profileData));
      
      setHasUnsavedChanges(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile settings have been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      let errorMessage = 'Failed to save profile settings.';
      
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          errorMessage = 'Storage quota exceeded. Please free up space and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Save Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultProfile: ProfileData = {
      displayName: 'User',
      email: 'user@example.com',
      bio: '',
      avatar: '/img/avatars/avatar4.png',
      theme: 'system',
      notifications: true,
      autoSave: true,
      language: 'en',
    };
    
    setProfileData(defaultProfile);
    setValidationErrors({});
    setHasUnsavedChanges(true);
    
    toast({
      title: 'Settings Reset',
      description: 'Profile settings have been reset to defaults. Click Save to apply changes.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(profileData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'profile-settings.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Profile data has been exported successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export profile data.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex direction="column" w="100%" h="100%" p="20px">
      <Flex justify="space-between" align="center" mb="20px">
        <Text fontSize="2xl" fontWeight="700" color={textColor}>
          Profile Settings
        </Text>
        {hasUnsavedChanges && (
          <Text fontSize="sm" color="orange.500" fontStyle="italic">
            You have unsaved changes
          </Text>
        )}
      </Flex>
      
      <Card p="30px" bg={bgColor} borderRadius="20px" boxShadow="lg">
        <VStack spacing="25px" align="stretch">
          {/* Profile Picture Section */}
          <Box>
            <Text fontSize="lg" fontWeight="600" color={textColor} mb="15px">
              Profile Picture
            </Text>
            <HStack spacing="20px">
              <Avatar size="xl" src={profileData.avatar} name={profileData.displayName} />
              <VStack align="start" spacing="10px">
                <Button size="sm" colorScheme="blue" variant="outline" isDisabled>
                  Change Avatar
                </Button>
                <Text fontSize="sm" color="gray.500">
                  Avatar upload feature coming soon
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Divider />

          {/* Personal Information */}
          <Box>
            <Text fontSize="lg" fontWeight="600" color={textColor} mb="15px">
              Personal Information
            </Text>
            <VStack spacing="15px">
              <FormControl isInvalid={!!validationErrors.displayName}>
                <FormLabel color={textColor}>Display Name *</FormLabel>
                <Input
                  value={profileData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.500' }}
                  placeholder="Enter your display name"
                />
                <FormErrorMessage>{validationErrors.displayName}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!validationErrors.email}>
                <FormLabel color={textColor}>Email *</FormLabel>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.500' }}
                  placeholder="Enter your email address"
                />
                <FormErrorMessage>{validationErrors.email}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!validationErrors.bio}>
                <FormLabel color={textColor}>Bio</FormLabel>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.500' }}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  resize="vertical"
                />
                <FormErrorMessage>{validationErrors.bio}</FormErrorMessage>
                <Text fontSize="xs" color="gray.500" mt="5px">
                  {profileData.bio.length}/500 characters
                </Text>
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Preferences */}
          <Box>
            <Text fontSize="lg" fontWeight="600" color={textColor} mb="15px">
              Preferences
            </Text>
            <VStack spacing="15px">
              <FormControl>
                <FormLabel color={textColor}>Language</FormLabel>
                <Select
                  value={profileData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.500' }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel color={textColor}>Theme</FormLabel>
                <Select
                  value={profileData.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value as 'light' | 'dark' | 'system')}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.500' }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </Select>
              </FormControl>
              
              <HStack justify="space-between" w="100%">
                <VStack align="start" spacing="5px">
                  <Text color={textColor}>Enable Notifications</Text>
                  <Text fontSize="sm" color="gray.500">Receive updates and alerts</Text>
                </VStack>
                <Switch
                  isChecked={profileData.notifications}
                  onChange={(e) => handleInputChange('notifications', e.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
              
              <HStack justify="space-between" w="100%">
                <VStack align="start" spacing="5px">
                  <Text color={textColor}>Auto-save Conversations</Text>
                  <Text fontSize="sm" color="gray.500">Automatically save chat history</Text>
                </VStack>
                <Switch
                  isChecked={profileData.autoSave}
                  onChange={(e) => handleInputChange('autoSave', e.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
            </VStack>
          </Box>

          <Divider />

          {/* Action Buttons */}
          <HStack spacing="15px" justify="space-between">
            <HStack spacing="10px">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportData}
                borderColor={borderColor}
                color={textColor}
              >
                Export Data
              </Button>
            </HStack>
            
            <HStack spacing="10px">
              <Button
                variant="outline"
                onClick={handleReset}
                borderColor={borderColor}
                color={textColor}
              >
                Reset to Defaults
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSave}
                isLoading={isLoading}
                loadingText="Saving..."
                isDisabled={Object.keys(validationErrors).some(key => validationErrors[key as keyof ValidationErrors])}
              >
                Save Changes
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </Card>
    </Flex>
  );
}