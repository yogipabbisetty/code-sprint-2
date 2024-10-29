import { Button } from '@mui/material'
import React from 'react'

export default function ButtonCustom({text,mx,Click,borderRadius=50,mt=2,mb=2}) {
  return (
    <Button variant="contained"  className="btn btn-primary btn-block fa-lg gradient-custom-2" sx={{mt:mt,mb:mb}}  disableRipple={true} disableElevation onClick={()=>Click()}>
            {text}
    </Button>
  )
}
