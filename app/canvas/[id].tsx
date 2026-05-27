import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { buildSVG, buildPrintHTML } from '../../lib/export';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import {
  Canvas,
  Group,
  Line,
  Circle,
  Text as SkiaText,
  vec,
} from '@shopify/react-native-skia';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { useTemplateStore } from '../../stores/templateStore';
import { evaluateFormulas } from '../../lib/formula-engine';
import { PatternPoint } from '../../lib/store';

const CM_TO_PX = 40;

export default function PatternCanvasScreen() {
  const { id, m, cn } = useLocalSearchParams<{ id: string; m: string; cn?: string }>();
  const router = useRouter();

  const { loadedTemplates, catalog, fetchTemplate } = useTemplateStore();
  const { addRecord } = useHistoryStore();
  const hasSaved = useRef(false);
  const meta = catalog.find((t) => t.id === id);
  const template = loadedTemplates[id];

  const [showConstruction, setShowConstruction] = useState(true);
  const [exporting, setExporting] = useState(false);

  const translateX = useSharedValue(20);
  const translateY = useSharedValue(20);
  const savedX = useSharedValue(20);
  const savedY = useSharedValue(20);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    if (!template && meta) fetchTemplate(meta);
  }, [template, meta, fetchTemplate]);

  const measurements = useMemo(() => {
    try {
      return JSON.parse(decodeURIComponent(m ?? '{}')) as Record<string, number>;
    } catch {
      return {};
    }
  }, [m]);

  const result = useMemo(() => {
    if (!template) return null;
    const patternPoints: Record<string, PatternPoint> = {};
    template.points.forEach((pt, i) => {
      patternPoints[String(i)] = {
        name: pt.name,
        xFormula: pt.x,
        yFormula: pt.y,
      };
    });
    return evaluateFormulas(measurements, patternPoints);
  }, [template, measurements]);

  const computed = result?.computed ?? {};

  useEffect(() => {
    if (
      hasSaved.current ||
      !template ||
      !result ||
      result.error ||
      Object.keys(result.computed).length === 0 ||
      !meta
    ) return;
    hasSaved.current = true;
    addRecord({
      customerId: undefined,
      customerName: cn ?? 'Manual entry',
      templateId: id,
      templateName: meta.variant ?? template.projectName,
      measurements,
    });
  }, [template, result, addRecord, cn, id, measurements, meta]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const canvasTransform = useDerivedValue(() => [
    { translateX: translateX.value },
    { translateY: translateY.value },
    { scale: scale.value },
  ]);

  const pointEntries = Object.entries(computed);
  const showLabels = pointEntries.length < 30;

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable onPress={() => router.back()}>
          <Text className="text-white text-2xl mr-3">←</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold flex-1" numberOfLines={1}>
          {template?.projectName ?? meta?.variant ?? 'Pattern'}
        </Text>
        <Pressable onPress={() => setShowConstruction((v) => !v)}>
          <Text className="text-blue-400 text-sm">
            {showConstruction ? 'Hide lines' : 'Show lines'}
          </Text>
        </Pressable>
      </View>

      {!template && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3b82f6" />
        </View>
      )}

      {template && result?.error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-center">{result.error}</Text>
        </View>
      )}

      {template && !result?.error && (
        <>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <GestureDetector gesture={gesture}>
              <Canvas style={styles.canvas}>
                <Group transform={canvasTransform}>
                  {showConstruction &&
                    template.lines.map((line, i) => {
                      const from = computed[line.from];
                      const to = computed[line.to];
                      if (!from || !to) return null;
                      return (
                        <Line
                          key={i}
                          p1={vec(from.x * CM_TO_PX, from.y * CM_TO_PX)}
                          p2={vec(to.x * CM_TO_PX, to.y * CM_TO_PX)}
                          color="#e5e7eb"
                          strokeWidth={1.5}
                        />
                      );
                    })}

                  {pointEntries.map(([, pt]) => (
                    <Circle
                      key={`c-${pt.x}-${pt.y}`}
                      cx={pt.x * CM_TO_PX}
                      cy={pt.y * CM_TO_PX}
                      r={3}
                      color="#3b82f6"
                    />
                  ))}

                  {showLabels &&
                    pointEntries.map(([name, pt]) => (
                      <SkiaText
                        key={`l-${name}`}
                        x={pt.x * CM_TO_PX + 5}
                        y={pt.y * CM_TO_PX - 5}
                        text={name}
                        font={null}
                        color="#9ca3af"
                      />
                    ))}
                </Group>
              </Canvas>
            </GestureDetector>
          </GestureHandlerRootView>

          <View className="flex-row px-4 py-3 bg-gray-900 gap-3">
            <Pressable
              className={`flex-1 bg-gray-700 rounded-xl py-3 items-center ${exporting ? 'opacity-50' : ''}`}
              disabled={exporting}
              onPress={async () => {
                if (!template || !result?.computed) return;
                setExporting(true);
                try {
                  const patternTitle = template.projectName ?? meta?.variant ?? 'Pattern';
                  const svg = buildSVG(result.computed, template.lines, 10, patternTitle, measurements);
                  const path = FileSystem.cacheDirectory + `pattern-${id}.svg`;
                  await FileSystem.writeAsStringAsync(path, svg, {
                    encoding: FileSystem.EncodingType.UTF8,
                  });
                  await Sharing.shareAsync(path, {
                    mimeType: 'image/svg+xml',
                    dialogTitle: 'Export SVG',
                  });
                } catch (e) {
                  Alert.alert('Export failed', (e as Error).message);
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Text className="text-white font-semibold">
                {exporting ? 'Exporting…' : 'SVG'}
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 bg-blue-500 rounded-xl py-3 items-center ${exporting ? 'opacity-50' : ''}`}
              disabled={exporting}
              onPress={async () => {
                if (!template || !result?.computed) return;
                setExporting(true);
                try {
                  const patternTitle = template.projectName ?? meta?.variant ?? 'Pattern';
                  const html = buildPrintHTML(result.computed, template.lines, patternTitle, measurements);
                  await Print.printAsync({ html });
                } catch (e) {
                  Alert.alert('Export failed', (e as Error).message);
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Text className="text-white font-semibold">
                {exporting ? 'Exporting…' : 'PDF'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  canvas: {
    flex: 1,
  },
});
