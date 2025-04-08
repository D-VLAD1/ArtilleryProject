function updateWeaponCatalog() {
    const weaponType = document.getElementById('weapon-type').value;
    const catalogDiv = document.getElementById('weapon-catalog');
  
    // Очистити попередній каталог
    catalogDiv.innerHTML = '';
  
    // Додаємо різні варіанти зброї в залежності від типу
    let weapons = [];
  
    if (weaponType === 'artillery') {
      weapons = [
        { name: 'М101', img: 'm101.png' },
        { name: 'М777', img: 'm777.png' },
        { name: 'Д-30', img: 'd30.png' }
      ];
    } else if (weaponType === 'rocket') {
      weapons = [
        { name: 'С-300', img: 's300.png' },
        { name: 'Бук-М1', img: 'buk.png' },
        { name: 'Точка-У', img: 'tochka.png' }
      ];
    } else if (weaponType === 'missile') {
      weapons = [
        { name: 'БРМЗ', img: 'brmz.png' },
        { name: 'Ярс', img: 'yars.png' },
        { name: 'Томагавк', img: 'tomahawk.png' }
      ];
    }
  
    // Додаємо кожен елемент в каталог
    weapons.forEach(weapon => {
      const weaponItem = document.createElement('div');
      weaponItem.classList.add('weapon-item');
      
      const img = document.createElement('img');
      img.src = weapon.img;
      img.alt = weapon.name;
      weaponItem.appendChild(img);
      
      const name = document.createElement('p');
      name.textContent = weapon.name;
      weaponItem.appendChild(name);
  
      weaponItem.onclick = () => selectWeapon(weapon.name); // Дії при виборі зброї
  
      catalogDiv.appendChild(weaponItem);
    });
  }
  
  function selectWeapon(weaponName) {
    console.log(`Вибрано зброю: ${weaponName}`);
    // Тут можеш додати функціонал для роботи з вибраною зброєю
  }
  