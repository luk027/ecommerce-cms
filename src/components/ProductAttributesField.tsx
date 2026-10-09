'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import { mergeTagAttributeDefs, TagAttributeDef } from '@/utilities/mergeAttributes'
import { normalizeLabel } from '@/utilities/normalize'

interface StoredAttribute {
  label: string
  value: string
  group?: string | null
  id?: string
}

function getAttributeKey(label: string, group?: string | null): string {
  const normLabel = normalizeLabel(label)
  const normGroup = group ? normalizeLabel(group) : ''
  return normGroup ? `${normGroup}::${normLabel}` : normLabel
}

export function ProductAttributesField(props: { path?: string; readOnly?: boolean }) {
  const path = props.path || 'attributes'

  // Watch selected tags from the form
  const rawTags = useFormFields(([fields]: any) => fields?.tags?.value)

  const [tagData, setTagData] = useState<{ key: string; definitions: TagAttributeDef[] } | null>(
    null,
  )
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Extract array of string IDs from tags form value
  const tagIds = useMemo(() => {
    if (!rawTags) return []
    const arr = Array.isArray(rawTags) ? rawTags : [rawTags]
    return arr
      .map((t: any) => {
        if (!t) return null
        if (typeof t === 'object') return String(t.id || t._id || t.value || '')
        return String(t)
      })
      .filter((id): id is string => Boolean(id && id.trim()))
  }, [rawTags])
  const tagKey = tagIds.join(',')
  const availableDefs = tagData?.key === tagKey ? tagData.definitions : []
  const loading = tagIds.length > 0 && tagData?.key !== tagKey

  // Client-side validator for Payload Form
  const validateField = useCallback(
    (val: any) => {
      if (availableDefs.length === 0) return true
      const list: StoredAttribute[] = Array.isArray(val) ? val : []

      for (const def of availableDefs) {
        const key = getAttributeKey(def.label, def.group)
        const normDefLabel = normalizeLabel(def.label)

        const item = list.find((a) => {
          if (!a?.label) return false
          const aKey = getAttributeKey(a.label, a.group)
          return aKey === key || normalizeLabel(a.label) === normDefLabel
        })
        const valStr =
          item?.value !== undefined && item?.value !== null ? String(item.value).trim() : ''

        const displayLabel = def.group ? `${def.group} > ${def.label}` : def.label

        if (!valStr) {
          return `Attribute "${displayLabel}" cannot be empty.`
        }

        const validation = def.validation || {}
        const valType = validation.type || 'text'

        if (valType === 'boolean') {
          const lower = valStr.toLowerCase()
          const isBool =
            lower === 'true' ||
            lower === 'false' ||
            lower === 'yes' ||
            lower === 'no' ||
            lower === '1' ||
            lower === '0'
          if (!isBool) {
            return `Attribute "${displayLabel}" must be selected as True or False.`
          }
        } else if (valType === 'number') {
          const num = Number(valStr)
          if (isNaN(num)) return `Attribute "${displayLabel}" must be a number.`
          if (typeof validation.min === 'number' && num < validation.min) {
            return `Attribute "${displayLabel}" must be at least ${validation.min}.`
          }
          if (typeof validation.max === 'number' && num > validation.max) {
            return `Attribute "${displayLabel}" cannot exceed ${validation.max}.`
          }
        } else {
          if (typeof validation.min === 'number' && valStr.length < validation.min) {
            return `Attribute "${displayLabel}" must be at least ${validation.min} characters.`
          }
          if (typeof validation.max === 'number' && valStr.length > validation.max) {
            return `Attribute "${displayLabel}" cannot exceed ${validation.max} characters.`
          }
        }
      }

      return true
    },
    [availableDefs],
  )

  const {
    value: fieldValue,
    setValue,
    showError,
    errorMessage,
  } = useField({
    path,
    validate: validateField,
  })
  const value: StoredAttribute[] = Array.isArray(fieldValue) ? fieldValue : []

  // Fetch tag documents whenever tagIds change
  useEffect(() => {
    if (!tagKey) return

    let isMounted = true

    fetch(`/api/storefront/tags?ids=${encodeURIComponent(tagKey)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((tagsData) => {
        if (!isMounted) return
        setTagData({ key: tagKey, definitions: mergeTagAttributeDefs(tagsData) })
      })
      .catch(() => {
        if (!isMounted) return
        setTagData({ key: tagKey, definitions: [] })
      })

    return () => {
      isMounted = false
    }
  }, [tagKey])

  // Helper to lookup current value for an attribute definition
  const getValueForDef = useCallback(
    (def: TagAttributeDef): string => {
      if (!Array.isArray(value)) return ''
      const targetKey = getAttributeKey(def.label, def.group)
      const normLabel = normalizeLabel(def.label)

      const found = value.find((item) => {
        if (!item?.label) return false
        const itemKey = getAttributeKey(item.label, item.group)
        return itemKey === targetKey || normalizeLabel(item.label) === normLabel
      })

      return found?.value !== undefined && found?.value !== null ? String(found.value) : ''
    },
    [value],
  )

  // Handler for changes to an attribute value
  const handleInputChange = (def: TagAttributeDef, newVal: string) => {
    const currentValues = Array.isArray(value) ? [...value] : []
    const targetKey = getAttributeKey(def.label, def.group)
    const normLabel = normalizeLabel(def.label)

    const existingIndex = currentValues.findIndex((item) => {
      if (!item?.label) return false
      const itemKey = getAttributeKey(item.label, item.group)
      return (
        itemKey === targetKey ||
        (normalizeLabel(item.label) === normLabel && (!item.group || !def.group))
      )
    })

    const entry: StoredAttribute = {
      label: def.label,
      value: newVal,
      ...(def.group ? { group: def.group } : {}),
    }

    if (existingIndex >= 0) {
      currentValues[existingIndex] = {
        ...currentValues[existingIndex],
        ...entry,
      }
    } else {
      currentValues.push(entry)
    }

    setValue(currentValues)
  }

  const getValidationError = (def: TagAttributeDef, currentVal: string) => {
    const trimmed = currentVal.trim()
    const displayLabel = def.group ? `${def.group} > ${def.label}` : def.label

    if (!trimmed) {
      return `Value is required for "${displayLabel}".`
    }

    const validation = def.validation || {}
    const valType = validation.type || 'text'

    if (valType === 'boolean') {
      const lower = trimmed.toLowerCase()
      const isBool =
        lower === 'true' ||
        lower === 'false' ||
        lower === 'yes' ||
        lower === 'no' ||
        lower === '1' ||
        lower === '0'
      if (!isBool) {
        return 'Please select True or False.'
      }
    } else if (valType === 'number') {
      const num = Number(trimmed)
      if (isNaN(num)) return 'Must be a valid number.'
      if (typeof validation.min === 'number' && num < validation.min) {
        return `Minimum allowed value is ${validation.min}.`
      }
      if (typeof validation.max === 'number' && num > validation.max) {
        return `Maximum allowed value is ${validation.max}.`
      }
    } else {
      if (typeof validation.min === 'number' && trimmed.length < validation.min) {
        return `Must be at least ${validation.min} characters.`
      }
      if (typeof validation.max === 'number' && trimmed.length > validation.max) {
        return `Must not exceed ${validation.max} characters.`
      }
    }

    return null
  }

  // Split available definitions into individual vs grouped
  const { individualDefs, groupedDefs } = useMemo(() => {
    const individual: TagAttributeDef[] = []
    const groupedMap = new Map<string, TagAttributeDef[]>()

    for (const def of availableDefs) {
      if (def.group && def.group.trim()) {
        const gName = def.group.trim()
        if (!groupedMap.has(gName)) {
          groupedMap.set(gName, [])
        }
        groupedMap.get(gName)!.push(def)
      } else {
        individual.push(def)
      }
    }

    return {
      individualDefs: individual,
      groupedDefs: Array.from(groupedMap.entries()).map(([groupName, items]) => ({
        groupName,
        items,
      })),
    }
  }, [availableDefs])

  // Count filled attributes
  const filledCount = useMemo(() => {
    return availableDefs.filter((def) => {
      const val = getValueForDef(def)
      return val.trim().length > 0
    }).length
  }, [availableDefs, getValueForDef])

  // If no tags selected OR selected tags have no attributes defined -> display NOTHING
  if (tagIds.length === 0 || (!loading && availableDefs.length === 0)) {
    return null
  }

  // Renders a single attribute input item
  const renderAttributeItem = (def: TagAttributeDef) => {
    const key = getAttributeKey(def.label, def.group)
    const currentVal = getValueForDef(def)
    const validation = def.validation || {}
    const valType = validation.type || 'text'
    const isTouched = Boolean(touched[key])
    const error = isTouched || showError ? getValidationError(def, currentVal) : null

    // Badges for constraints
    const badges: { text: string }[] = []
    if (valType === 'boolean') {
      badges.push({ text: 'Boolean' })
    } else if (valType === 'number') {
      badges.push({ text: 'Number' })
      if (validation.min !== undefined && validation.min !== null) {
        badges.push({ text: `Min: ${validation.min}` })
      }
      if (validation.max !== undefined && validation.max !== null) {
        badges.push({ text: `Max: ${validation.max}` })
      }
    } else {
      badges.push({ text: 'Text' })
      if (validation.min) badges.push({ text: `Min: ${validation.min} chars` })
      if (validation.max) badges.push({ text: `Max: ${validation.max} chars` })
    }

    return (
      <div
        key={key}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 14px',
          borderRadius: '6px',
          background: 'var(--theme-elevation-100, #1f1f1f)',
          border: error
            ? '1px solid rgba(239, 68, 68, 0.5)'
            : '1px solid var(--theme-elevation-150, #2b2b2b)',
          transition: 'border-color 0.15s ease',
        }}
      >
        {/* Attribute header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <label
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--theme-elevation-800, #eaeaea)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{def.label}</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }} title="Required">
              *
            </span>
          </label>

          <div style={{ display: 'flex', gap: '6px' }}>
            {badges.map((b, i) => (
              <span
                key={i}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background:
                    b.text === 'Boolean'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'var(--theme-elevation-200, #333333)',
                  color: b.text === 'Boolean' ? '#60a5fa' : 'var(--theme-elevation-500, #a0a0a0)',
                  fontWeight: 500,
                }}
              >
                {b.text}
              </span>
            ))}
          </div>
        </div>

        {/* Input Control */}
        {valType === 'boolean' ? (
          (() => {
            const currentLower = currentVal.trim().toLowerCase()
            const isTrue = currentLower === 'true' || currentLower === 'yes' || currentLower === '1'
            const isFalse =
              currentLower === 'false' || currentLower === 'no' || currentLower === '0'

            return (
              <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                <button
                  type="button"
                  disabled={props.readOnly}
                  onClick={() => {
                    setTouched((prev) => ({ ...prev, [key]: true }))
                    handleInputChange(def, 'true')
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: props.readOnly ? 'not-allowed' : 'pointer',
                    border: isTrue
                      ? '1px solid #10b981'
                      : '1px solid var(--theme-elevation-200, #3a3a3a)',
                    background: isTrue
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'var(--theme-elevation-50, #141414)',
                    color: isTrue ? '#34d399' : 'var(--theme-elevation-600, #b0b0b0)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ✓ True / Yes
                </button>
                <button
                  type="button"
                  disabled={props.readOnly}
                  onClick={() => {
                    setTouched((prev) => ({ ...prev, [key]: true }))
                    handleInputChange(def, 'false')
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: props.readOnly ? 'not-allowed' : 'pointer',
                    border: isFalse
                      ? '1px solid #ef4444'
                      : '1px solid var(--theme-elevation-200, #3a3a3a)',
                    background: isFalse
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'var(--theme-elevation-50, #141414)',
                    color: isFalse ? '#f87171' : 'var(--theme-elevation-600, #b0b0b0)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ✕ False / No
                </button>
              </div>
            )
          })()
        ) : (
          <input
            type={valType === 'number' ? 'number' : 'text'}
            disabled={props.readOnly}
            value={currentVal}
            placeholder={`Enter ${def.label}...`}
            min={valType === 'number' ? (validation.min ?? undefined) : undefined}
            max={valType === 'number' ? (validation.max ?? undefined) : undefined}
            maxLength={valType === 'text' ? (validation.max ?? undefined) : undefined}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, [key]: true }))
            }}
            onChange={(e) => {
              if (!touched[key]) {
                setTouched((prev) => ({ ...prev, [key]: true }))
              }
              handleInputChange(def, e.target.value)
            }}
            style={{
              padding: '9px 12px',
              borderRadius: '5px',
              border: error ? '1px solid #ef4444' : '1px solid var(--theme-elevation-200, #3a3a3a)',
              background: 'var(--theme-elevation-50, #141414)',
              color: 'var(--theme-elevation-900, #ffffff)',
              fontSize: '13px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
          />
        )}

        {/* Inline error feedback */}
        {error && (
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '11px',
              color: '#ef4444',
              fontWeight: 500,
            }}
          >
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        margin: '24px 0',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid var(--theme-elevation-150, #303030)',
        background: 'var(--theme-elevation-50, #161616)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        fontFamily: 'inherit',
      }}
    >
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '18px',
          borderBottom: '1px solid var(--theme-elevation-100, #252525)',
          paddingBottom: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h4
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'var(--theme-elevation-900, #ffffff)',
              }}
            >
              Product Attributes
            </h4>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: '12px',
                background:
                  filledCount === availableDefs.length && availableDefs.length > 0
                    ? 'rgba(40, 167, 69, 0.2)'
                    : 'rgba(255, 193, 7, 0.2)',
                color:
                  filledCount === availableDefs.length && availableDefs.length > 0
                    ? '#4ade80'
                    : '#fbbf24',
              }}
            >
              {availableDefs.length > 0
                ? `${filledCount}/${availableDefs.length} Required Filled`
                : 'Tags Selected'}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              lineHeight: '1.4',
              color: 'var(--theme-elevation-500, #999999)',
            }}
          >
            These attributes are required by the selected tags. You must enter a value for each
            single or group attribute before saving.
          </p>
        </div>
      </div>

      {/* Global error message if present */}
      {showError && errorMessage && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ef4444',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Body content */}
      {loading && availableDefs.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--theme-elevation-400, #888)' }}>
            Loading tag attributes...
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Individual / Single Attributes */}
          {individualDefs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupedDefs.length > 0 && (
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--theme-elevation-500, #888888)',
                    paddingBottom: '4px',
                    borderBottom: '1px dashed var(--theme-elevation-150, #2b2b2b)',
                  }}
                >
                  Individual Attributes
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {individualDefs.map((def) => renderAttributeItem(def))}
              </div>
            </div>
          )}

          {/* Grouped Attributes */}
          {groupedDefs.map(({ groupName, items }) => {
            const groupFilled = items.filter(
              (item) => getValueForDef(item).trim().length > 0,
            ).length

            return (
              <div
                key={groupName}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'var(--theme-elevation-75, #1a1a1a)',
                  border: '1px solid var(--theme-elevation-150, #2c2c2c)',
                }}
              >
                {/* Group Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--theme-elevation-125, #262626)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--theme-elevation-900, #ffffff)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      📁 {groupName}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'var(--theme-elevation-200, #333333)',
                        color: 'var(--theme-elevation-500, #a0a0a0)',
                      }}
                    >
                      Group
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color:
                        groupFilled === items.length
                          ? '#4ade80'
                          : 'var(--theme-elevation-400, #888888)',
                    }}
                  >
                    {groupFilled}/{items.length} Filled
                  </span>
                </div>

                {/* Group Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {items.map((def) => renderAttributeItem(def))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
