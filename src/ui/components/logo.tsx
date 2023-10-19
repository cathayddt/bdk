import React from 'react'
import { Newline, Text, Box } from 'ink'

export default function Logo () {
  return (
    <Box width={50} height={10} marginLeft={8} marginTop={5} justifyContent='center'>
      <Text color="#FFFFFF" >
        {'      '}::::::::    :::::::     :::    :::<Newline />
        {'     '}:+:   :+:   :+:   :+:   :+:   :+:<Newline />
        {'    '}+:+    +:+  +:+    +:+  +:+  +:+<Newline />
        {'   '}+#++:++#+   +#+    +:+  +#++:++<Newline />
        {'  '}+#+    +#+  +#+    +#+  +#+  +#+<Newline />
        {' '}#+#   #+#   #+#   #+#   #+#   #+#<Newline />
        ########    ########    ###    ###
      </Text></Box>
  )
}
