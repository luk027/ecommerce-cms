'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import { mergeTagAttributeDefs, TagAttributeDef } from '../lib/catalog/mergeAttributes'
import { normalizeLabel } from '../lib/catalog/normalize'

interface StoredAttribute {
  label: string
  value: string
  id?: string
}

export function ProductAttributesField(props: { path?: string; readOnly?: boolean }) {
  const path = props.path || 'attributes'

  // Watch selected tags from the form
  const rawTags = useFormFields(([fields]: any) => fields?.tags?.value)

  const [availableDefs, setAvailableDefs] = useState<TagAttributeDef[]>([])
  const [loading, setLoading] = useState(false)
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

  // Client-side validator for Payload Form
  const validateField = useCallback(
    (val: any) => {
      if (availableDefs.length === 0) return true
      const list: StoredAttribute[] = Array.isArray(val) ? val : []

      for (const def of availableDefs) {
        const norm = normalizeLabel(def.label)
        const item = list.find((a) => normalizeLabel(a?.label || '') === norm)
        const valStr = item?.value !== undefined && item?.value !== null ? String(item.value).trim() : ''

        if (!valStr) {
          return `Attribute "${def.label}" cannot be empty.`
        }

        const validation = def.validation || {}
        if (validation.type === 'number') {
          const num = Number(valStr)
          if (isNaN(num)) return `Attribute "${def.label}" must be a number.`
          if (typeof validation.min === 'number' && num < validation.min) {
            return `Attribute "${def.label}" must be at least ${validation.min}.`
          }
          if (typeof validation.max === 'number' && num > validation.max) {
            return `Attribute "${def.label}" cannot exceed ${validation.max}.`
          }
        } else {
          if (typeof validation.min === 'number' && valStr.length < validation.min) {
            return `Attribute "${def.label}" must be at least ${validation.min} characters.`
          }
          if (typeof validation.max === 'number' && valStr.length > validation.max) {
            return `Attribute "${def.label}" cannot exceed ${validation.max} characters.`
          }
        }
      }

      return true
    },
    [availableDefs]
  )

  const { value: fieldValue, setValue, showError, errorMessage } = useField({
    path,
    validate: validateField,
  })
  const value: StoredAttribute[] = Array.isArray(fieldValue) ? fieldValue : []

  // Fetch tag documents whenever tagIds change
  useEffect(() => {
    if (tagIds.length === 0) {
      setAvailableDefs([])
      return
    }

    let isMounted = true
    setLoading(true)

    fetch(`/api/catalog/tags?ids=${encodeURIComponent(tagIds.join(','))}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((tagsData) => {
        if (!isMounted) return
        const defs = mergeTagAttributeDefs(tagsData)
        setAvailableDefs(defs)
      })
      .catch(() => {
        if (!isMounted) return
        setAvailableDefs([])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [tagIds.join(',')])

  // If no tags selected OR selected tags have no attributes defined -> display NOTHING
  if (tagIds.length === 0 || (!loading && availableDefs.length === 0)) {
    return null
  }

  // Map of current values by normalized label
  const valueMap = new Map<string, string>()
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item?.label) {
        valueMap.set(
          normalizeLabel(item.label),
          item.value !== undefined && item.value !== null ? String(item.value) : ''
        )
      }
    }
  }

  const handleInputChange = (label: string, newVal: string) => {
    const currentValues = Array.isArray(value) ? [...value] : []
    const norm = normalizeLabel(label)

    const existingIndex = currentValues.findIndex((item) => normalizeLabel(item.label) === norm)

    if (existingIndex >= 0) {
      currentValues[existingIndex] = {
        ...currentValues[existingIndex],
        label,
        value: newVal,
      }
    } else {
      currentValues.push({
        label,
        value: newVal,
      })
    }

    setValue(currentValues)
  }

  const getValidationError = (def: TagAttributeDef, currentVal: string) => {
    const trimmed = currentVal.trim()
    if (!trimmed) {
      return 'Value is required and cannot be empty.'
    }

    const validation = def.validation || {}
    if (validation.type === 'number') {
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

  // Count how many are filled
  const filledCount = availableDefs.filter((def) => {
    const val = valueMap.get(normalizeLabel(def.label)) || ''
    return val.trim().length > 0
  }).length

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
            These attributes are required by the selected tags. You must enter a value for each attribute before saving.
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {availableDefs.map((def) => {
            const norm = normalizeLabel(def.label)
            const currentVal = valueMap.get(norm) ?? ''
            const validation = def.validation || {}
            const valType = validation.type || 'text'
            const isTouched = Boolean(touched[norm])
            const error = isTouched || showError ? getValidationError(def, currentVal) : null

            // Badges for constraints
            const badges: { text: string; bg?: string }[] = []
            if (valType === 'number') {
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
                key={norm}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  background: 'var(--theme-elevation-100, #1f1f1f)',
                  border: error
                    ? '1px solid rgba(239, 68, 68, 0.4)'
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
                          padding: '1px 7px',
                          borderRadius: '4px',
                          background: 'var(--theme-elevation-200, #333333)',
                          color: 'var(--theme-elevation-500, #a0a0a0)',
                          fontWeight: 500,
                        }}
                      >
                        {b.text}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Input field */}
                <input
                  type={valType === 'number' ? 'number' : 'text'}
                  disabled={props.readOnly}
                  value={currentVal}
                  placeholder={`Enter ${def.label}...`}
                  min={valType === 'number' ? validation.min ?? undefined : undefined}
                  max={valType === 'number' ? validation.max ?? undefined : undefined}
                  maxLength={valType === 'text' ? validation.max ?? undefined : undefined}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [norm]: true }))
                  }}
                  onChange={(e) => {
                    if (!touched[norm]) {
                      setTouched((prev) => ({ ...prev, [norm]: true }))
                    }
                    handleInputChange(def.label, e.target.value)
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '5px',
                    border: error
                      ? '1px solid #ef4444'
                      : '1px solid var(--theme-elevation-200, #3a3a3a)',
                    background: 'var(--theme-elevation-50, #141414)',
                    color: 'var(--theme-elevation-900, #ffffff)',
                    fontSize: '13px',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                />

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
          })}
        </div>
      )}
    </div>
  )
}
