import React from 'react';
import { useRoute } from '@react-navigation/native';
import { CounselProfile } from '../components/CounselProfile';

/**
 * CourtListener has no separate prosecutor entity: prosecutors are attorneys
 * whose PACER contact block lists a government office (U.S. Attorney, DA, DOJ…).
 */
export default function ProsecutorProfileScreen() {
  const route = useRoute<any>();
  return <CounselProfile id={String(route.params?.id ?? '')} variant="prosecutor" />;
}
