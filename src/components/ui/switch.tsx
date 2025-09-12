import * as React from 'react';

export function Switch({checked, onChange, disabled}: {checked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean}){
  return (
    <button 
      type='button' 
      aria-pressed={!!checked} 
      onClick={() => !disabled && onChange?.(!checked)} 
      disabled={disabled} 
      className={`inline-flex h-6 w-11 items-center rounded-full border ${checked ? 'bg-gray-900' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`}/>
    </button>
  )
};

export default Switch;



