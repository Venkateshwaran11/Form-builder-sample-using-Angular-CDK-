import { Injectable } from '@angular/core';
import { FieldConfig, FormDiffResult, FieldDiffItem, PropertyDiff } from '../dynamic-form/models/field-config.interface';

@Injectable({
  providedIn: 'root'
})
export class FormDiffService {

  compare(configA: FieldConfig[] = [], configB: FieldConfig[] = [], vA: any = 'A', vB: any = 'B'): FormDiffResult {
    const items: FieldDiffItem[] = [];
    const usedBIndices = new Set<number>();

    // Pass 1: For each field in Version A, find its corresponding counterpart in Version B
    configA.forEach((fieldA, indexA) => {
      let matchedIndexB = -1;

      // 1. Primary Match: exact match on field 'name' (unique control name in forms)
      if (fieldA.name) {
        matchedIndexB = configB.findIndex((b, idx) => !usedBIndices.has(idx) && b.name === fieldA.name);
      }

      // 2. Secondary Match: exact match on stable 'fieldId' (handles renamed fields)
      if (matchedIndexB === -1 && fieldA.fieldId) {
        matchedIndexB = configB.findIndex((b, idx) => !usedBIndices.has(idx) && b.fieldId === fieldA.fieldId);
      }

      // 3. Fallback: match by identical label and type
      if (matchedIndexB === -1 && fieldA.label && fieldA.type) {
        matchedIndexB = configB.findIndex((b, idx) => !usedBIndices.has(idx) && b.label === fieldA.label && b.type === fieldA.type);
      }

      if (matchedIndexB !== -1) {
        usedBIndices.add(matchedIndexB);
        const fieldB = configB[matchedIndexB];
        const propDiffs = this.checkPropertyDiffs(fieldA, fieldB);
        const isReordered = indexA !== matchedIndexB;

        if (propDiffs.length > 0) {
          items.push({
            fieldId: fieldA.name || fieldA.fieldId || `idx_${indexA}`,
            changeType: 'modified',
            oldField: fieldA,
            newField: fieldB,
            oldIndex: indexA,
            newIndex: matchedIndexB,
            propertyChanges: propDiffs
          });
        } else if (isReordered) {
          items.push({
            fieldId: fieldA.name || fieldA.fieldId || `idx_${indexA}`,
            changeType: 'reordered',
            oldField: fieldA,
            newField: fieldB,
            oldIndex: indexA,
            newIndex: matchedIndexB
          });
        } else {
          items.push({
            fieldId: fieldA.name || fieldA.fieldId || `idx_${indexA}`,
            changeType: 'unchanged',
            oldField: fieldA,
            newField: fieldB,
            oldIndex: indexA,
            newIndex: matchedIndexB
          });
        }
      } else {
        // Field was deleted in Version B
        items.push({
          fieldId: fieldA.name || fieldA.fieldId || `idx_${indexA}`,
          changeType: 'removed',
          oldField: fieldA,
          oldIndex: indexA
        });
      }
    });

    // Pass 2: Remaining unused fields in Version B were Added
    configB.forEach((fieldB, indexB) => {
      if (!usedBIndices.has(indexB)) {
        items.push({
          fieldId: fieldB.name || fieldB.fieldId || `idx_${indexB}`,
          changeType: 'added',
          newField: fieldB,
          newIndex: indexB
        });
      }
    });

    return {
      versionA: vA,
      versionB: vB,
      items,
      addedCount: items.filter(i => i.changeType === 'added').length,
      removedCount: items.filter(i => i.changeType === 'removed').length,
      modifiedCount: items.filter(i => i.changeType === 'modified').length,
      unchangedCount: items.filter(i => i.changeType === 'unchanged').length
    };
  }

  private checkPropertyDiffs(a: FieldConfig, b: FieldConfig): PropertyDiff[] {
    const diffs: PropertyDiff[] = [];
    const props: (keyof FieldConfig)[] = [
      'label', 'name', 'type', 'required', 'placeholder', 
      'width', 'min', 'max', 'disabled'
    ];

    props.forEach(prop => {
      // Normalize booleans (undefined vs false)
      if (prop === 'required' || prop === 'disabled') {
        const boolA = !!a[prop];
        const boolB = !!b[prop];
        if (boolA !== boolB) {
          diffs.push({ property: String(prop), oldValue: boolA, newValue: boolB });
        }
        return;
      }

      const valA = a[prop] === undefined || a[prop] === null ? '' : a[prop];
      const valB = b[prop] === undefined || b[prop] === null ? '' : b[prop];

      if (valA !== valB) {
        diffs.push({
          property: String(prop),
          oldValue: a[prop],
          newValue: b[prop]
        });
      }
    });

    // Check options for dropdowns/radio
    const optsA = JSON.stringify(a.options || []);
    const optsB = JSON.stringify(b.options || []);
    if (optsA !== optsB) {
      diffs.push({
        property: 'options',
        oldValue: a.options,
        newValue: b.options
      });
    }

    return diffs;
  }
}