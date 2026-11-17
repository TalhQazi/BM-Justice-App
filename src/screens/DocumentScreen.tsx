import React, { useState } from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { CalendarDays, ChevronDown, FileText, Hash, Layers } from 'lucide-react-native';
import * as cl from '../services/courtlistener';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/format';
import { DetailScaffold } from '../components/DetailScaffold';
import { ProfileHero } from '../components/ProfileHero';
import { StatGrid } from '../components/StatGrid';
import { ErrorState } from '../components/ErrorState';
import { AppText, Button, Card, EmptyState } from '../components/ui';

const PREVIEW = 4000;

/** A court filing read entirely inside the app. */
export default function DocumentScreen() {
  const route = useRoute<any>();
  const id: string = String(route.params?.id ?? '');
  const caseName: string | undefined = route.params?.caseName;
  const doc = useAsync(() => cl.getRecapDocument(id), [id], { enabled: !!id });
  const [showAll, setShowAll] = useState(false);
  const d = doc.data;
  const text = d?.text || '';

  return (
    <DetailScaffold
      title={d ? `Document ${d.documentNumber ?? ''}`.trim() : undefined}
      loading={doc.loading && !d}
      loadingLabel="Loading filing…"
      notFound={!doc.loading && !d && !doc.error}
      notFoundTitle="Filing not found"
    >
      {doc.error && !d ? (
        <ErrorState error={doc.error} onRetry={doc.reload} />
      ) : d ? (
        <>
          <ProfileHero
            name={d.description}
            icon={FileText}
            eyebrow={caseName || 'Court filing'}
            badges={[d.available ? { label: 'Full text available', tone: 'success', dot: true } : { label: 'Text not yet available', tone: 'neutral' }]}
          />

          <StatGrid
            items={[
              { label: 'Document no.', value: d.documentNumber ? `#${d.documentNumber}` : '—', icon: Hash },
              { label: 'Pages', value: d.pageCount ? String(d.pageCount) : '—', icon: Layers, tone: 'info' },
              { label: 'Attachment', value: d.attachmentNumber ? `#${d.attachmentNumber}` : 'Main document', icon: FileText, tone: 'teal' },
              { label: 'Added', value: formatDate(d.dateUploaded), icon: CalendarDays, tone: 'success' },
            ]}
          />

          {text ? (
            <Card>
              <AppText variant="overline" style={{ marginBottom: 10 }}>
                Document text
              </AppText>
              <AppText variant="body" style={{ lineHeight: 22 }} selectable>
                {showAll ? text : text.slice(0, PREVIEW)}
                {!showAll && text.length > PREVIEW ? '…' : ''}
              </AppText>
              {text.length > PREVIEW ? (
                <Button
                  label={showAll ? 'Show less' : `Read the full document (${Math.round(text.length / 1000)}k characters)`}
                  variant="secondary"
                  size="sm"
                  iconRight={ChevronDown}
                  onPress={() => setShowAll((s) => !s)}
                  style={{ marginTop: 12 }}
                />
              ) : null}
            </Card>
          ) : (
            <View>
              <EmptyState
                icon={FileText}
                title="Text not available yet"
                message="The text of this filing hasn’t been made public yet. Its details are shown above."
              />
            </View>
          )}
        </>
      ) : null}
    </DetailScaffold>
  );
}
