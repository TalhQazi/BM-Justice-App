import React from 'react';
import { useRoute } from '@react-navigation/native';
import { CounselProfile } from '../components/CounselProfile';

export default function AttorneyProfileScreen() {
  const route = useRoute<any>();
  return <CounselProfile id={String(route.params?.id ?? '')} variant="attorney" />;
}
