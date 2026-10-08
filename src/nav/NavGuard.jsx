import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import Icon from '../dashboard/Icon'

const Ctx = createContext(null)

// Lets a page (the order editor) mark itself "dirty". Every navigation that leaves
// the page (tabs, logo, account menu, logout, Back/Cancel buttons) goes through
// requestLeave(); when the page is dirty the Unsaved Changes dialog is shown first.
export function NavGuardProvider({ children }) {
  const dirtyRef = useRef(false)
  const [pending, setPending] = useState(null)

  const setDirty = useCallback((value) => { dirtyRef.current = value }, [])
  const requestLeave = useCallback((action) => {
    if (dirtyRef.current) setPending(() => action)
    else action()
  }, [])

  const value = useMemo(() => ({ setDirty, requestLeave }), [setDirty, requestLeave])

  function leave() {
    const action = pending
    dirtyRef.current = false
    setPending(null)
    action()
  }

  return (
    <Ctx.Provider value={value}>
      {children}
      {pending && (
        <Modal variant="light" title="Unsaved Changes" onClose={() => setPending(null)}>
          <span className="ui-modal-icon" style={{ background: '#fff1e0', color: '#f97316' }}><Icon name="warn" size={40} /></span>
          <p className="ui-modal-text">{'You have unsaved changes to this order.\nIf you leave now, your changes will be lost.'}</p>
          <div className="ui-modal-actions">
            <button type="button" className="ui-btn outline-light" onClick={() => setPending(null)}>Stay</button>
            <button type="button" className="ui-btn red" onClick={leave}>Leave Without Saving</button>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  )
}

export function useNavGuard() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNavGuard must be used inside <NavGuardProvider>')
  return ctx
}

// Register the current page's dirty state; cleared automatically when it unmounts.
export function useDirtyGuard(isDirty) {
  const { setDirty } = useNavGuard()
  useEffect(() => {
    setDirty(isDirty)
    return () => setDirty(false)
  }, [isDirty, setDirty])
}
